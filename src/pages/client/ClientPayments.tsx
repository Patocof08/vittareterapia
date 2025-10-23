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
  psychologist: {
    first_name: string;
    last_name: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
  };
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

      // Fetch only completed payments with psychologist info
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          psychologist:psychologist_profiles!fk_payment_psychologist(
            first_name,
            last_name
          ),
          invoice:invoices(id, invoice_number)
        `)
        .eq("client_id", user.id)
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match interface
      const transformedPayments = (paymentsData || []).map(p => ({
        ...p,
        invoice: Array.isArray(p.invoice) && p.invoice.length > 0 ? p.invoice[0] : undefined
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

  const getStatusBadge = (status: string) => {
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
    };
    return config[status] || { label: status, className: "" };
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
        <h1 className="text-3xl font-bold text-foreground">
          Pagos
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus pagos y recibos
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${stats.totalPaid.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sesiones Pagadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.sessionsPaid}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {payments.length > 0 ? `$${Number(payments[0].amount).toFixed(2)}` : "$0.00"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.length > 0 
                ? format(new Date(payments[0].created_at), "dd/MM/yyyy", { locale: es })
                : "Sin pagos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No tienes pagos registrados aún
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
                        {payment.psychologist
                          ? `${payment.psychologist.first_name} ${payment.psychologist.last_name}`
                          : ""}
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
                      {payment.payment_status === "completed" && (
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
