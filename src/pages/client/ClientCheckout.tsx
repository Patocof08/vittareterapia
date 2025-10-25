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
          psychologist:psychologist_profiles!fk_payment_psychologist(
            first_name,
            last_name
          ),
          appointment:appointments!fk_payment_appointment(
            start_time
          )
        `)
        .eq("id", paymentId)
        .single();

      if (error) throw error;

      // For packages, get appointment date from localStorage if not yet created
      let appointmentDate = payment.appointment?.start_time;
      if (!appointmentDate && (payment.payment_type === "package_4" || payment.payment_type === "package_8")) {
        const tempDataStr = localStorage.getItem("pending_package_appointment");
        if (tempDataStr) {
          const tempData = JSON.parse(tempDataStr);
          appointmentDate = tempData.start_time;
        }
      }

      setCheckoutData({
        payment_id: payment.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        description: payment.description,
        psychologist_name: `${payment.psychologist.first_name} ${payment.psychologist.last_name}`,
        appointment_date: appointmentDate,
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
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuario no autenticado");

      // Check if this is a package payment
      const isPackage = checkoutData.payment_type === "package_4" || checkoutData.payment_type === "package_8";

      if (isPackage) {
        // Handle package purchase
        const tempDataStr = localStorage.getItem("pending_package_appointment");
        if (!tempDataStr) throw new Error("Datos de paquete no encontrados");
        
        const tempData = JSON.parse(tempDataStr);
        const sessionsTotal = tempData.sessions_total;
        const packageTypeValue = tempData.package_type === "package_4" ? "4_sessions" : "8_sessions";

        // Get pricing info
        const { data: pricingData } = await supabase
          .from("psychologist_pricing")
          .select("session_price")
          .eq("psychologist_id", tempData.psychologist_id)
          .single();

        const regularPrice = (pricingData?.session_price || 0) * sessionsTotal;
        const discountPercentage = Math.round(((regularPrice - checkoutData.amount) / regularPrice) * 100);

        // Create subscription
        const { data: subscription, error: subError } = await supabase
          .from("client_subscriptions")
          .insert({
            client_id: currentUser.id,
            psychologist_id: tempData.psychologist_id,
            session_price: pricingData?.session_price || 0,
            discount_percentage: discountPercentage,
            sessions_total: sessionsTotal,
            sessions_used: 1,
            sessions_remaining: sessionsTotal - 1,
            package_type: packageTypeValue,
            status: "active",
            auto_renew: true,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (subError) throw subError;

        // Process package purchase (wallet accounting)
        const { error: rpcError } = await supabase.rpc('process_package_purchase', {
          _subscription_id: subscription.id,
          _payment_id: checkoutData.payment_id,
          _psychologist_id: tempData.psychologist_id,
          _total_amount: checkoutData.amount,
          _sessions_total: sessionsTotal,
          _discount_percentage: discountPercentage,
        });

        if (rpcError) throw rpcError;

        // Create first appointment
        const { data: appointment, error: apptError } = await supabase
          .from("appointments")
          .insert({
            patient_id: currentUser.id,
            psychologist_id: tempData.psychologist_id,
            start_time: tempData.start_time,
            end_time: tempData.end_time,
            status: "pending",
            modality: "Videollamada",
          })
          .select()
          .single();

        if (apptError) throw apptError;

        // Update payment with subscription and appointment info
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({
            subscription_id: subscription.id,
            appointment_id: appointment.id,
            payment_status: "completed",
            completed_at: new Date().toISOString(),
            payment_method: "Transferencia/Efectivo",
          })
          .eq("id", checkoutData.payment_id);

        if (paymentUpdateError) throw paymentUpdateError;

        // Create invoice
        const { error: invoiceError } = await supabase.from("invoices").insert({
          payment_id: checkoutData.payment_id,
          client_id: currentUser.id,
          psychologist_id: tempData.psychologist_id,
          amount: checkoutData.amount,
          invoice_number: '',
        });

        if (invoiceError) console.error("Error creating invoice:", invoiceError);

        // Clean up temp data
        localStorage.removeItem("pending_package_appointment");

        toast.success(`¡Paquete de ${sessionsTotal} sesiones adquirido con éxito!`);
        navigate("/portal/suscripciones");
      } else {
        // Handle single session payment
        const { error: paymentError } = await supabase
          .from("payments")
          .update({
            payment_status: "completed",
            completed_at: new Date().toISOString(),
            payment_method: "Transferencia/Efectivo",
          })
          .eq("id", checkoutData.payment_id);

        if (paymentError) throw paymentError;

        // Get payment data (for RPC + invoice)
        const { data: paymentData } = await supabase
          .from("payments")
          .select("psychologist_id, appointment_id")
          .eq("id", checkoutData.payment_id)
          .single();

        // Register deferred revenue for single session (85% to therapist, 15% admin)
        if (paymentData) {
          const { error: rpcError } = await supabase.rpc('process_single_session_payment', {
            _payment_id: checkoutData.payment_id,
            _psychologist_id: paymentData.psychologist_id,
            _total_amount: checkoutData.amount,
            _appointment_id: paymentData.appointment_id,
          });
          if (rpcError) {
            console.error("Error processing single session payment:", rpcError);
            toast.error("Pago registrado, pero hubo un error contable");
          }
        }

        // Create invoice
        if (paymentData) {
          const { error: invoiceError } = await supabase.from("invoices").insert({
            payment_id: checkoutData.payment_id,
            client_id: currentUser.id,
            psychologist_id: paymentData.psychologist_id,
            amount: checkoutData.amount,
            invoice_number: '',
          });

          if (invoiceError) console.error("Error creating invoice:", invoiceError);
        }

        toast.success("¡Pago procesado con éxito!");
        navigate("/portal/sesiones");
      }
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
                  <span className="text-muted-foreground">
                    {checkoutData.payment_type === "single_session" 
                      ? "Fecha de sesión:" 
                      : "Primera sesión:"}
                  </span>
                  <span className="font-medium">
                    {format(
                      new Date(checkoutData.appointment_date),
                      "dd 'de' MMMM, yyyy 'a las' HH:mm",
                      { locale: es }
                    )}
                  </span>
                </div>
              )}

              {(checkoutData.payment_type === "package_4" || checkoutData.payment_type === "package_8") && (
                <div className="bg-primary/10 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Incluye:</p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>{checkoutData.payment_type === "package_4" ? "4" : "8"} sesiones mensuales</li>
                    <li>Renovación automática</li>
                    <li>Rollover del 25% de sesiones no utilizadas</li>
                    <li>Cancela cuando quieras</li>
                  </ul>
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
