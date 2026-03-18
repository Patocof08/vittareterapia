import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Calendar, Clock, Star } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const canJoinCall = (startTime: string) => {
  const diffMin = (new Date(startTime).getTime() - Date.now()) / (1000 * 60);
  return diffMin <= 15 && diffMin >= -30;
};

export default function ClientSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [lateDialogOpen, setLateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [refundOption, setRefundOption] = useState<"credit" | "refund" | null>(null);
  const [reviewedAppointments, setReviewedAppointments] = useState<Set<string>>(new Set());
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReviewSession, setSelectedReviewSession] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // A session moves to history 30 minutes after its start_time, or immediately if completed/cancelled
      const historyThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

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
      const upcoming = data?.filter((a) => a.start_time >= historyThreshold && a.status !== "cancelled") || [];
      // @ts-ignore - Types will regenerate automatically
      const past = data?.filter((a) => a.start_time < historyThreshold || a.status === "completed" || a.status === "cancelled") || [];

      setUpcomingSessions(upcoming);
      setPastSessions(past);

      // Load which appointments have already been reviewed
      if (past.length > 0) {
        // @ts-ignore - Types will regenerate automatically
        const { data: existingReviews } = await supabase
          .from("reviews")
          .select("appointment_id")
          .eq("patient_id", user.id);
        if (existingReviews) {
          setReviewedAppointments(new Set(existingReviews.map((r: any) => r.appointment_id)));
        }
      }
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

  const notifyCancellation = (appointment: any) => {
    (async () => {
      try {
        const { data: psych } = await supabase
          .from("psychologist_profiles")
          .select("user_id, first_name")
          .eq("id", appointment.psychologist_id)
          .single();
        if (!psych?.user_id) return;

        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user!.id)
          .single();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            notification_type: "cancellation",
            recipient_user_id: psych.user_id,
            variables: {
              recipient_name: psych.first_name || "Psicólogo",
              patient_name: clientProfile?.full_name || "Un paciente",
              session_date: format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: es }),
              session_time: format(new Date(appointment.start_time), "HH:mm"),
            },
          }),
        }).catch(() => {});
      } catch {}
    })();
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
      notifyCancellation(selectedAppointment);
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
      notifyCancellation(selectedAppointment);
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
          notifyCancellation(selectedAppointment);
        } else {
          toast.success("Cita cancelada.");
          notifyCancellation(selectedAppointment);
        }
      } else {
        // Opción reembolso: edge function que llama a Stripe + actualiza DB
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession?.access_token) throw new Error("No autenticado");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authSession.access_token}`,
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              appointment_id: selectedAppointment.id,
              payment_id: payment?.id ?? null,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al procesar el reembolso");
        }

        toast.success(
          `Cita cancelada. Reembolso de ${result.amount_refunded} MXN procesado. Se reflejará en tu estado de cuenta en 3-5 días hábiles.`
        );
        notifyCancellation(selectedAppointment);
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

  const handleSubmitReview = async () => {
    if (!selectedReviewSession || reviewRating === 0) return;
    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase.from("reviews").insert({
        appointment_id: selectedReviewSession.id,
        psychologist_id: selectedReviewSession.psychologist_id,
        patient_id: user!.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });
      if (error) throw error;
      setReviewedAppointments((prev) => new Set([...prev, selectedReviewSession.id]));
      toast.success("¡Gracias por tu reseña!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error al enviar la reseña");
    } finally {
      setReviewDialogOpen(false);
      setSelectedReviewSession(null);
      setReviewRating(0);
      setReviewComment("");
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
          <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Mis Sesiones</h1>
          <p className="text-[#6B7280] mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Mis Sesiones
        </h1>
        <p className="text-[#6B7280] mt-1">
          Historial y próximas citas
        </p>
      </div>

      {/* Próximas Sesiones */}
      <Card className="border-0 border-l-4 border-l-[#12A357] shadow-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
            <span className="p-1.5 rounded-lg bg-[#12A357]">
              <Calendar className="w-4 h-4 text-white" />
            </span>
            Próximas Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              No tienes sesiones programadas
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F0FBF5] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-[#1F2937]">
                        {session.psychologist_profiles.first_name} {session.psychologist_profiles.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#6B7280] mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(session.start_time), "dd/MM/yyyy - HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">
                        Videollamada
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(session.status)}
                      {(session.status === "pending" || session.status === "confirmed") && canJoinCall(session.start_time) && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/session/${session.id}`)}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Unirse
                        </Button>
                      )}
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
      <Card className="border-0 border-l-4 border-l-[#6AB7AB] shadow-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
            <span className="p-1.5 rounded-lg bg-[#6AB7AB]">
              <Video className="w-4 h-4 text-white" />
            </span>
            Historial de Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              No tienes sesiones completadas
            </div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div key={session.id} className="p-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F0FBF5] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[#1F2937]">
                        {session.psychologist_profiles.first_name} {session.psychologist_profiles.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#6B7280] mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(session.start_time), "dd/MM/yyyy - HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(session.status)}
                      {session.status === "completed" && (
                        reviewedAppointments.has(session.id) ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            Reseña enviada
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReviewSession(session);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Calificar
                          </Button>
                        )
                      )}
                    </div>
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

      {/* Dialog para enviar reseña */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Calificar sesión</DialogTitle>
          </DialogHeader>
          {selectedReviewSession && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-[#6B7280]">
                Sesión con {selectedReviewSession.psychologist_profiles?.first_name} {selectedReviewSession.psychologist_profiles?.last_name} —{" "}
                {format(new Date(selectedReviewSession.start_time), "dd/MM/yyyy", { locale: es })}
              </p>
              <div>
                <p className="text-sm font-medium mb-2">Tu calificación</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Comentario (opcional)</p>
                <Textarea
                  placeholder="Comparte tu experiencia..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setReviewDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitReview} disabled={reviewRating === 0}>
                  Enviar reseña
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
