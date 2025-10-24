import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Check, ArrowLeft } from "lucide-react";

interface CheckoutData {
  payment_id: string;
  amount: number;
  payment_type: string;
  description: string;
  psychologist_name: string;
  psychologist_id: string;
  client_id: string;
  appointment_id?: string;
  appointment_date?: string;
}

export default function ClientCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    if (!paymentId) {
      toast.error("No se encontró información de pago");
      navigate("/portal");
      return;
    }
    fetchPaymentData(paymentId);
  }, [searchParams]);

  const fetchPaymentData = async (paymentId: string) => {
    try {
      const { data: payment, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_type,
          description,
          client_id,
          psychologist_id,
          appointment_id,
          psychologist_profiles!inner(
            first_name,
            last_name
          ),
          appointments(
            start_time
          )
        `)
        .eq("id", paymentId)
        .single();

      if (error) throw error;

      setCheckoutData({
        payment_id: payment.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        description: payment.description || "",
        client_id: payment.client_id,
        psychologist_id: payment.psychologist_id,
        psychologist_name: `${payment.psychologist_profiles.first_name} ${payment.psychologist_profiles.last_name}`,
        appointment_id: payment.appointment_id || undefined,
        appointment_date: payment.appointments?.start_time,
      });
    } catch (error) {
      console.error("Error fetching payment:", error);
      toast.error("Error al cargar los datos de pago");
      navigate("/portal");
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

  const handlePayment = async () => {
    if (!checkoutData) return;

    setProcessing(true);
    try {
      // Verificar si el pago ya fue procesado
      const { data: currentPayment } = await supabase
        .from("payments")
        .select("payment_status")
        .eq("id", checkoutData.payment_id)
        .single();

      if (currentPayment?.payment_status === "completed") {
        toast.success("¡Pago ya procesado!");
        
        setTimeout(() => {
          if (checkoutData.payment_type === "single_session") {
            navigate("/client/sessions");
          } else {
            navigate("/client/subscriptions");
          }
        }, 1000);
        return;
      }

      // Simular confirmación final
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          payment_status: "completed",
          completed_at: new Date().toISOString(),
          payment_method: "stripe",
        })
        .eq("id", checkoutData.payment_id);

      if (paymentError) throw paymentError;

      // Update appointment status if exists
      if (checkoutData.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "confirmed" })
          .eq("id", checkoutData.appointment_id);
      }

      // If package, create subscription
      if (checkoutData.payment_type === "package_4" || checkoutData.payment_type === "package_8") {
        const sessionsTotal = checkoutData.payment_type === "package_4" ? 4 : 8;
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const { data: pricing } = await supabase
          .from("psychologist_pricing")
          .select("session_price")
          .eq("psychologist_id", checkoutData.psychologist_id)
          .single();

        let discountPercentage = 0;
        if (pricing) {
          const regularPrice = Number(pricing.session_price) * sessionsTotal;
          discountPercentage = Math.round(((regularPrice - checkoutData.amount) / regularPrice) * 100);
        }

        await supabase.from("client_subscriptions").insert({
          client_id: checkoutData.client_id,
          psychologist_id: checkoutData.psychologist_id,
          package_type: checkoutData.payment_type,
          sessions_total: sessionsTotal,
          sessions_remaining: sessionsTotal,
          sessions_used: 0,
          session_price: pricing ? Number(pricing.session_price) : 0,
          discount_percentage: discountPercentage,
          status: "active",
          auto_renew: false,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_billing_date: null,
        });
      }

      // Create invoice
      await supabase.from("invoices").insert({
        payment_id: checkoutData.payment_id,
        client_id: checkoutData.client_id,
        psychologist_id: checkoutData.psychologist_id,
        amount: checkoutData.amount,
        currency: "MXN",
        issued_at: new Date().toISOString(),
      } as any);

      toast.success("¡Pago procesado exitosamente!");

      setTimeout(() => {
        if (checkoutData.payment_type === "single_session") {
          navigate("/client/sessions");
        } else {
          navigate("/client/subscriptions");
        }
      }, 1500);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!checkoutData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Completar Pago
          </h1>
          <p className="text-muted-foreground mt-2">
            Revisa los detalles y completa tu pago
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Resumen de Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de Pago:</span>
                <Badge variant="outline">
                  {getPaymentTypeLabel(checkoutData.payment_type)}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Psicólogo:</span>
                <span className="font-medium">{checkoutData.psychologist_name}</span>
              </div>

              {checkoutData.appointment_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de sesión:</span>
                  <span className="font-medium">
                    {format(
                      new Date(checkoutData.appointment_date),
                      "dd 'de' MMMM, yyyy 'a las' HH:mm",
                      { locale: es }
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Descripción:</span>
                <span className="text-right max-w-[250px]">
                  {checkoutData.description}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-medium">Total a Pagar:</span>
              <span className="text-2xl font-bold text-primary">
                ${checkoutData.amount.toFixed(2)} MXN
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                Por el momento, los pagos se procesan mediante:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Transferencia bancaria</li>
                <li>Depósito en efectivo</li>
                <li>Pago en consulta</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Una vez confirmado tu pago, recibirás tu recibo electrónico.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pago
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Al confirmar, aceptas nuestros términos y condiciones de pago
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
