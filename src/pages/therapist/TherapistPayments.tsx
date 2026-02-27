import { DollarSign, TrendingUp, FileText, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  base_amount: number;
  currency: string;
  payment_type: string;
  payment_status: string;
  created_at: string;
  completed_at: string;
  appointment_id?: string;
  subscription_id?: string;
  client: {
    full_name: string;
  };
  appointment?: {
    status: string;
    cancellation_reason?: string;
    start_time: string;
  };
}

interface EarningsStats {
  monthlyIncome: number;
  monthlySessions: number;
  pendingPayments: number;
  totalEarnings: number;
}

export default function TherapistPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending"); // "completed", "pending", "cancelled"
  const [stats, setStats] = useState<EarningsStats>({
    monthlyIncome: 0,
    monthlySessions: 0,
    pendingPayments: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sessionPriceFallback, setSessionPriceFallback] = useState<number>(0);

  // Ganancia neta del psicólogo: siempre 85% de su precio de sesión establecido.
  const getDisplayAmount = (payment: Payment) => {
    const appointment = payment.appointment;
    const cancelReason = appointment?.cancellation_reason || "";
    const isLateCancellation =
      appointment?.status === "cancelled" && cancelReason.includes("menos de 24h");

    // Cancelación tardía: el psicólogo cobra igual
    if (!isLateCancellation) {
      if (
        payment.payment_status === "cancelled" ||
        appointment?.status === "cancelled"
      ) {
        return 0;
      }
    }

    // Usar base_amount (precio sin platform fee) para el 85% del psicólogo
    if (payment.payment_type === "single_session") {
      const base = Number(payment.base_amount || payment.amount || 0);
      if (base > 0) return base * 0.85;
    }
    // Para paquetes, usar session_price × 85% del perfil
    return Number(sessionPriceFallback || 0);
  };
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get psychologist profile
      const { data: psychProfile } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!psychProfile) return;

      // Obtener precio de sesión del terapeuta para fallback en sesiones individuales
      // El psicólogo recibe 85% del precio de sesión
      const { data: pricingData } = await supabase
        .from("psychologist_pricing")
        .select("session_price")
        .eq("psychologist_id", psychProfile.id)
        .single();

      const fullPrice = Number(pricingData?.session_price || 0);
      const psychologistEarning = fullPrice * 0.85;
      setSessionPriceFallback(psychologistEarning);

      // Fetch payments with client info and appointment details
      // ONLY show payments that have an appointment_id (excludes package purchase payments)
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:profiles!fk_payment_client(
            full_name
          ),
          appointment:appointments!fk_payment_appointment(
            status,
            cancellation_reason,
            start_time
          )
        `)
        .eq("psychologist_id", psychProfile.id)
        .not("appointment_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rawPayments = paymentsData || [];

      // Normalizar arrays que Supabase puede devolver como array o objeto
      const transformedPayments = rawPayments.map((p: any) => ({
        ...p,
        client: Array.isArray(p.client) ? p.client[0] : p.client,
        appointment: Array.isArray(p.appointment) ? p.appointment[0] : p.appointment,
      }));

      setPayments(transformedPayments);
      // Calcular stats desde wallet_transactions (montos exactos ya reconocidos al psicólogo)
      const { data: txData } = await supabase
        .from("wallet_transactions")
        .select("amount, created_at")
        .eq("psychologist_id", psychProfile.id)
        .eq("wallet_type", "psychologist")
        .in("transaction_type", ["session_completed", "account_deletion"]);

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const monthlyTx = (txData || []).filter(tx => {
        const d = new Date(tx.created_at);
        return d >= monthStart && d <= monthEnd;
      });

      // Pendientes: sesiones activas que aún no se han tomado (sin wallet_transaction aún)
      const pending = transformedPayments.filter(p =>
        p.appointment &&
        p.appointment.status !== "cancelled" &&
        p.appointment.status !== "completed"
      );

      setStats({
        monthlyIncome:   monthlyTx.reduce((sum, tx) => sum + Number(tx.amount), 0),
        monthlySessions: monthlyTx.length,
        pendingPayments: pending.reduce((sum, p) => sum + getDisplayAmount(p), 0),
        totalEarnings:   (txData || []).reduce((sum, tx) => sum + Number(tx.amount), 0),
      });

      // Apply default filter
      applyFilter("pending", transformedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filter: string, paymentsToFilter = payments) => {
    setStatusFilter(filter);
    let filtered = [...paymentsToFilter];

    switch (filter) {
      case "completed":
        // Completadas: sesiones tomadas O canceladas tarde (se cobran)
        filtered = paymentsToFilter.filter(p => 
          (p.appointment?.status === "completed") ||
          (p.appointment?.status === "cancelled" && p.appointment?.cancellation_reason?.includes("menos de 24h"))
        );
        break;
      case "pending":
        // Pendientes: sesiones activas que aún no se toman (cita pendiente, no cancelada)
        filtered = paymentsToFilter.filter(p => 
          p.appointment && 
          p.appointment.status !== "cancelled" && 
          p.appointment.status !== "completed"
        );
        break;
      case "cancelled":
        // Canceladas a tiempo (sin cargo)
        filtered = paymentsToFilter.filter(p => 
          p.payment_status === "cancelled" ||
          (p.appointment?.status === "cancelled" && !p.appointment?.cancellation_reason?.includes("menos de 24h"))
        );
        break;
      case "all":
        // Mostrar todas
        filtered = paymentsToFilter;
        break;
    }

    setFilteredPayments(filtered);
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single_session: "Sesión Individual",
      package_4: "Sesión Individual",
      package_8: "Sesión Individual",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (payment: Payment) => {
    const appointment = payment.appointment;
    const cancelReason = appointment?.cancellation_reason || "";
    
    // Cancelado tarde (se cobra) - mostrar como completado
    if (appointment?.status === "cancelled" && cancelReason.includes("menos de 24h")) {
      return {
        label: "Completado (Cancelado tarde)",
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
      };
    }
    
    // Cancelado a tiempo (sin cargo)
    if (payment.payment_status === "cancelled" || (appointment?.status === "cancelled" && !cancelReason.includes("menos de 24h"))) {
      return {
        label: "Cancelado",
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800"
      };
    }
    
    // Si la cita está pendiente (no cancelada), mostrar como pendiente
    if (appointment && appointment.status !== "cancelled" && appointment.status !== "completed") {
      return { 
        label: "Pendiente", 
        className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800" 
      };
    }
    
    // Si la cita está completada o el pago está completado sin cita cancelada
    if (appointment?.status === "completed" || payment.payment_status === "completed") {
      return { 
        label: "Completado", 
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" 
      };
    }
    
    // Default: mostrar el estado del pago
    return { 
      label: "Pendiente", 
      className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800" 
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pagos e Ingresos</h1>
        <p className="text-muted-foreground mt-1">
          Revisa tus ingresos y pagos pendientes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlySessions} sesiones este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingPayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter(p => p.payment_status === 'pending').length} pagos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Histórico</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historial de Pagos
            </div>
            <Select value={statusFilter} onValueChange={applyFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {statusFilter === "completed"
                  ? "No hay pagos completados"
                  : statusFilter === "pending"
                  ? "No hay pagos pendientes"
                  : statusFilter === "cancelled"
                  ? "No hay pagos cancelados"
                  : "No hay transacciones registradas todavía"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => {
                const statusInfo = getStatusBadge(payment);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliente: {payment.client?.full_name || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fecha de sesión: {payment.appointment?.start_time 
                          ? format(new Date(payment.appointment.start_time), "dd 'de' MMMM, yyyy", { locale: es })
                          : format(new Date(payment.created_at), "dd 'de' MMMM, yyyy", { locale: es })
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                      <p className="font-bold min-w-[80px] text-right">
                        ${getDisplayAmount(payment).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
