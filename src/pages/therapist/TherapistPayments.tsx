import { DollarSign, TrendingUp, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_status: string;
  created_at: string;
  completed_at: string;
  client: {
    full_name: string;
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
  const [stats, setStats] = useState<EarningsStats>({
    monthlyIncome: 0,
    monthlySessions: 0,
    pendingPayments: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

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

      // Fetch payments with client info
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:profiles!fk_payment_client(
            full_name
          )
        `)
        .eq("psychologist_id", psychProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedPayments = (paymentsData || []).map(p => ({
        ...p,
        client: Array.isArray(p.client) ? p.client[0] : p.client
      }));

      setPayments(transformedPayments);

      // Calculate stats
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const completed = transformedPayments.filter(p => p.payment_status === 'completed');
      const monthlyCompleted = completed.filter(p => {
        const paymentDate = new Date(p.completed_at || p.created_at);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });
      const pending = transformedPayments.filter(p => p.payment_status === 'pending');

      setStats({
        monthlyIncome: monthlyCompleted.reduce((sum, p) => sum + Number(p.amount), 0),
        monthlySessions: monthlyCompleted.length,
        pendingPayments: pending.reduce((sum, p) => sum + Number(p.amount), 0),
        totalEarnings: completed.reduce((sum, p) => sum + Number(p.amount), 0),
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single_session: "Sesión Individual",
      package_4: "Paquete 4 Sesiones",
      package_8: "Paquete 8 Sesiones",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      completed: { 
        label: "Completado", 
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" 
      },
      pending: { 
        label: "Pendiente", 
        className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800" 
      },
    };
    return config[status] || { label: status, className: "" };
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
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No hay transacciones registradas todavía
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const statusInfo = getStatusBadge(payment.payment_status);
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
                        {format(new Date(payment.created_at), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                      <p className="font-bold min-w-[80px] text-right">
                        ${Number(payment.amount).toFixed(2)}
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
