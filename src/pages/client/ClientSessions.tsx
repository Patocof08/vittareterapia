import { useEffect, useState } from "react";
import { Video, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientSessions() {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [lateDialogOpen, setLateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [refundOption, setRefundOption] = useState<"credit" | "refund" | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // @ts-ignore - Types will regenerate automatically
      const now = new Date().toISOString();

      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        // @ts-ignore - Types will regenerate automatically
        .from("appointments")
        .select(`
          *,
          psychologist_profiles!inner(
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq("patient_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      // @ts-ignore - Types will regenerate automatically
      const upcoming = data?.filter((a) => a.start_time >= now && a.status !== "cancelled") || [];
      // @ts-ignore - Types will regenerate automatically
      const past = data?.filter((a) => a.start_time < now || a.status === "completed" || a.status === "cancelled") || [];

      setUpcomingSessions(upcoming);
      setPastSessions(past);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  };

  const checkCancellationPolicy = async (appointment: any) => {
    const sessionTime = new Date(appointment.start_time);
    const now = new Date();
    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Si es menos de 24 horas
    if (hoursUntilSession < 24) {
      setSelectedAppointment(appointment);
      setLateDialogOpen(true);
      return;
    }

    // Si es más de 24 horas, verificar tipo de pago
    const { data: payment } = await supabase
      .from("payments")
      .select("payment_type, subscription_id")
      .eq("appointment_id", appointment.id)
      .single();

    setSelectedAppointment(appointment);

    // Si es suscripción, automáticamente devolver crédito
    if (payment?.subscription_id) {
      setCancelDialogOpen(true);
    } else {
      // Si es sesión individual, preguntar opción
      setRefundDialogOpen(true);
    }
  };

  // Cancelación de cita de paquete (>24h): devuelve crédito al paquete, dinero sigue diferido
  const handlePackageCancellation = async () => {
    if (!selectedAppointment) return;
    try {
      const { error } = await supabase.rpc("cancel_package_session_early", {
        _appointment_id: selectedAppointment.id,
      });
      if (error) throw error;
      toast.success("Cita cancelada. El crédito se devolvió a tu paquete.");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Error al cancelar la cita");
    } finally {
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  // Cancelación tardía (<24h): cobra la sesión completa sin reembolso
  const handleLateCancellation = async () => {
    if (!selectedAppointment) return;
    try {
      const { error } = await supabase.rpc("cancel_session_late", {
        _appointment_id: selectedAppointment.id,
      });
      if (error) throw error;
      toast.success("Cita cancelada. La sesión fue cobrada por política de cancelación tardía.");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Error al cancelar la cita");
    } finally {
      setLateDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleRefundSelection = async () => {
    if (!selectedAppointment || !refundOption) return;
    try {
      // Obtener el pago y subscription asociados
      const { data: payment } = await supabase
        .from("payments")
        .select("id, amount, psychologist_id, subscription_id")
        .eq("appointment_id", selectedAppointment.id)
        .maybeSingle();

      if (refundOption === "credit") {
        // Opción crédito: el dinero se queda en diferido
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            cancelled_by: user?.id,
            cancellation_reason: "Cancelado - Crédito solicitado",
          })
          .eq("id", selectedAppointment.id);

        if (error) throw error;

        let creditAmount = 0;
        let psychologistId = selectedAppointment.psychologist_id;

        if (payment && payment.amount > 0) {
          creditAmount = payment.amount;
          psychologistId = payment.psychologist_id;
        } else {
          const { data: pricing } = await supabase
            .from("psychologist_pricing")
            .select("session_price")
            .eq("psychologist_id", selectedAppointment.psychologist_id)
            .single();
          
          if (pricing) {
            creditAmount = pricing.session_price;
          }
        }

        if (creditAmount > 0) {
          // Crear crédito con expiración en 6 meses
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 6);

          await supabase
            .from("client_credits")
            .insert({
              client_id: user?.id,
              psychologist_id: psychologistId,
              amount: creditAmount,
              currency: "MXN",
              reason: "Cancelación de sesión individual",
              original_appointment_id: selectedAppointment.id,
              status: "available",
              expires_at: expiresAt.toISOString(),
            });
          
          toast.success("Cita cancelada. El crédito estará disponible por 6 meses.");
        } else {
          toast.success("Cita cancelada.");
        }
      } else {
        // Opción reembolso: RPC maneja el diferido, el pago y la cita en una sola operación
        const { error } = await supabase.rpc("cancel_session_with_refund", {
          _appointment_id: selectedAppointment.id,
          _payment_id: payment?.id ?? null,
        });
        if (error) throw error;
        toast.success("Cita cancelada. El reembolso se procesará en 3-5 días hábiles.");
      }

      loadSessions();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Error al cancelar la cita");
    } finally {
      setRefundDialogOpen(false);
      setSelectedAppointment(null);
      setRefundOption(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      confirmed: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      completed: { label: "Completada", className: "bg-green-50 text-green-700 border-green-200" },
      cancelled: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
      no_show: { label: "Sin asistencia", className: "bg-gray-50 text-gray-700 border-gray-200" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Sesiones</h1>
          <p className="text-muted-foreground mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Mis Sesiones
        </h1>
        <p className="text-muted-foreground mt-1">
          Historial y próximas citas
        </p>
      </div>

      {/* Próximas Sesiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximas Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes sesiones programadas
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {session.psychologist_profiles.first_name} {session.psychologist_profiles.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(session.start_time), "dd/MM/yyyy - HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Videollamada
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(session.status)}
                      {(session.status === "pending" || session.status === "confirmed") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => checkCancellationPolicy(session)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Historial de Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes sesiones completadas
            </div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {session.psychologist_profiles.first_name} {session.psychologist_profiles.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(session.start_time), "dd/MM/yyyy - HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para suscripciones - automático */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Como tienes un paquete de sesiones, el crédito se devolverá automáticamente a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handlePackageCancellation}>
              Sí, cancelar y recuperar crédito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para sesiones individuales - elegir opción */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cómo prefieres tu reembolso?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelas con más de 24 horas de anticipación. Elige tu preferencia:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant={refundOption === "credit" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setRefundOption("credit")}
            >
              <div className="text-left">
                <div className="font-medium">Crédito en la plataforma</div>
                <div className="text-xs opacity-80">Úsalo en tu próxima sesión</div>
              </div>
            </Button>
            <Button
              variant={refundOption === "refund" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setRefundOption("refund")}
            >
              <div className="text-left">
                <div className="font-medium">Reembolso completo</div>
                <div className="text-xs opacity-80">Se procesa en 3-5 días hábiles</div>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRefundOption(null)}>
              No, mantener
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefundSelection}
              disabled={!refundOption}
            >
              Confirmar cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para cancelaciones tardías */}
      <AlertDialog open={lateDialogOpen} onOpenChange={setLateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aviso de política de cancelación</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Recuerda que para cancelar sin cargo, debes hacerlo con al menos 24 horas de anticipación.
              </p>
              <p className="font-medium text-foreground">
                Si cancelas ahora, la sesión se cobrará en su totalidad y no habrá reembolso.
              </p>
              <p className="text-sm mt-2">
                ¿Deseas continuar con la cancelación?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAppointment(null)}>
              No, mantener cita
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLateCancellation}>
              Sí, cancelar de todos modos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
