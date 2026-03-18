import { CreditCard, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_status: string;
  payment_method: string;
  description: string;
  created_at: string;
  completed_at: string;
  appointment_id?: string;
  psychologist: {
    first_name: string;
    last_name: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
  };
  appointment?: {
    status: string;
  };
  hasCredit?: boolean;
}

interface PaymentStats {
  totalPaid: number;
  sessionsPaid: number;
  pending: number;
}

export default function ClientPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    sessionsPaid: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all payments with psychologist, appointment, and invoice info
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          psychologist:psychologist_profiles!fk_payment_psychologist(
            first_name,
            last_name
          ),
          invoice:invoices(id, invoice_number),
          appointment:appointments!fk_payment_appointment(status)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check for credits (refund vs credit choice)
      const { data: creditsData } = await supabase
        .from("client_credits")
        .select("original_appointment_id")
        .eq("client_id", user.id);

      const appointmentIdsWithCredits = new Set(
        (creditsData || []).map(c => c.original_appointment_id).filter(Boolean)
      );

      // Transform data to match interface
      const transformedPayments = (paymentsData || []).map(p => ({
        ...p,
        invoice: Array.isArray(p.invoice) && p.invoice.length > 0 ? p.invoice[0] : undefined,
        appointment: Array.isArray(p.appointment) && p.appointment.length > 0 ? p.appointment[0] : undefined,
        hasCredit: p.appointment_id ? appointmentIdsWithCredits.has(p.appointment_id) : false
      }));
      
      setPayments(transformedPayments);

      // Calculate stats - only completed payments
      const completed = (paymentsData || []).filter(p => p.payment_status === 'completed');
      
      setStats({
        totalPaid: completed.reduce((sum, p) => sum + Number(p.amount), 0),
        sessionsPaid: completed.length,
        pending: 0,
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

  const getStatusBadge = (payment: Payment) => {
    // Check if appointment was cancelled for single sessions
    if (payment.appointment?.status === 'cancelled' && payment.payment_type === 'single_session') {
      if (payment.hasCredit) {
        return {
          label: "Cancelado (Crédito aplicado)",
          className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
        };
      } else {
        return {
          label: "Cancelado (Reembolso en proceso)",
          className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800"
        };
      }
    }

    const config: Record<string, { label: string; className: string }> = {
      completed: { 
        label: "Pagado", 
        className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" 
      },
      pending: { 
        label: "Pendiente", 
        className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800" 
      },
      failed: { 
        label: "Fallido", 
        className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" 
      },
      refunded: { 
        label: "Reembolsado", 
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800" 
      },
      cancelled: {
        label: "Cancelado",
        className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800"
      },
    };
    return config[payment.payment_status] || { label: payment.payment_status, className: "" };
  };

  const handleDownloadInvoice = (payment: Payment) => {
    // Placeholder for invoice download
    toast.info("La descarga de recibos estará disponible próximamente");
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
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Pagos
        </h1>
        <p className="text-[#6B7280] mt-1">
          Gestiona tus pagos y recibos
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 border-t-4 border-t-[#12A357] bg-gradient-to-br from-[#F0FBF5] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Total Pagado
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#12A357] shadow-sm shadow-[#12A357]/30">
              <CreditCard className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#12A357]">
              ${stats.totalPaid.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-4 border-t-[#6AB7AB] bg-gradient-to-br from-[#F0F9F7] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Sesiones Pagadas
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#6AB7AB] shadow-sm shadow-[#6AB7AB]/30">
              <FileText className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#6AB7AB]">{stats.sessionsPaid}</p>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-4 border-t-[#D9A932] bg-gradient-to-br from-[#FEFAED] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Último Pago
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#D9A932] shadow-sm shadow-[#D9A932]/30">
              <Download className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#D9A932]">
              {payments.length > 0 ? `$${Number(payments[0].amount).toFixed(2)}` : "$0.00"}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {payments.length > 0
                ? format(new Date(payments[0].created_at), "dd/MM/yyyy", { locale: es })
                : "Sin pagos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Pagos */}
      <Card className="border-0 border-l-4 border-l-[#D9A932] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
            <span className="p-1.5 rounded-lg bg-[#D9A932]">
              <CreditCard className="w-4 h-4 text-white" />
            </span>
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-[#6AB7AB] mb-3" />
              <p className="text-[#6B7280]">
                No tienes pagos registrados aún
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const statusInfo = getStatusBadge(payment);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F0FBF5] transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#1F2937]">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </p>
                      <p className="text-sm text-[#6B7280] mt-1">
                        {payment.psychologist
                          ? `${payment.psychologist.first_name} ${payment.psychologist.last_name}`
                          : ""}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">
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
                        ${Number(payment.amount || 0).toFixed(2)}
                      </p>
                      {payment.payment_status === "completed" && !payment.appointment?.status?.includes('cancelled') && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownloadInvoice(payment)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
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
