import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addMinutes, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BookingTypeDialog } from "@/components/client/BookingTypeDialog";
import { useNavigate } from "react-router-dom";

interface BookingCalendarProps {
  psychologistId: string;
  pricing: any;
}

export function BookingCalendar({ psychologistId, pricing }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, psychologistId]);

  const loadAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dayOfWeek = date.getDay();

      // Get psychologist's availability for this day
      // @ts-ignore - Types will regenerate automatically
      const { data: availability, error: availError } = await supabase
        .from("psychologist_availability")
        .select("start_time, end_time")
        .eq("psychologist_id", psychologistId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_exception", false);

      if (availError) throw availError;

      // Get existing appointments for this date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // @ts-ignore - Types will regenerate automatically
      const { data: appointments, error: apptError} = await supabase
        // @ts-ignore - Types will regenerate automatically
        .from("appointments")
        .select("start_time, end_time")
        .eq("psychologist_id", psychologistId)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .neq("status", "cancelled");

      if (apptError) throw apptError;

      // Generate time slots
      const slots: string[] = [];
      if (availability) {
        availability.forEach((block) => {
          const [startHour, startMin] = block.start_time.split(":").map(Number);
          const [endHour, endMin] = block.end_time.split(":").map(Number);

          let current = new Date(date);
          current.setHours(startHour, startMin, 0, 0);

          const end = new Date(date);
          end.setHours(endHour, endMin, 0, 0);

          while (current < end) {
            const slotStart = new Date(current);
            const slotEnd = addMinutes(slotStart, 50); // 50 min sessions

            // Check if slot is already booked
            // @ts-ignore - Types will regenerate automatically
            const isBooked = appointments?.some((appt) => {
              // @ts-ignore - Types will regenerate automatically
              const apptStart = parseISO(appt.start_time);
              // @ts-ignore - Types will regenerate automatically
              const apptEnd = parseISO(appt.end_time);
              return (
                (slotStart >= apptStart && slotStart < apptEnd) ||
                (slotEnd > apptStart && slotEnd <= apptEnd) ||
                (slotStart <= apptStart && slotEnd >= apptEnd)
              );
            });

            if (!isBooked && slotEnd <= end) {
              slots.push(format(slotStart, "HH:mm"));
            }

            current = addMinutes(current, 60); // 1 hour intervals
          }
        });
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Error al cargar horarios disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !user) {
      toast.error("Por favor selecciona fecha y hora");
      return;
    }

    // 1) Verificar créditos disponibles para ESTE psicólogo
    const { data: credits } = await supabase
      .from("client_credits")
      .select("*")
      .eq("client_id", user.id)
      .eq("status", "available")
      .is("used_at", null);

    const creditsForThisPsych = credits?.filter((c: any) => c.psychologist_id === psychologistId) || [];

    if (creditsForThisPsych.length > 0) {
      // Tiene créditos para este psicólogo → usarlos directamente
      await handleCreditBooking(creditsForThisPsych[0]);
      return;
    }

    // 2) Verificar suscripción activa con sesiones disponibles para ESTE psicólogo
    const { data: subscriptions } = await supabase
      .from("client_subscriptions")
      .select("id, sessions_remaining, sessions_used, sessions_total")
      .eq("client_id", user.id)
      .eq("psychologist_id", psychologistId)
      .eq("status", "active")
      .gt("sessions_remaining", 0);

    if (subscriptions && subscriptions.length > 0) {
      await handleSubscriptionBooking(subscriptions[0]);
      return;
    }

    // 3) No créditos ni suscripciones para este psicólogo → mostrar selector de plan
    setShowBookingDialog(true);
  };

  const handleCreditBooking = async (credit: any) => {
    if (!user || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, pricing?.session_duration_minutes || 50);

      // Create appointment
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          psychologist_id: psychologistId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "pending",
          modality: "Videollamada",
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Mark credit as used
      await supabase
        .from("client_credits")
        .update({
          status: "used",
          used_at: new Date().toISOString(),
          used_for_appointment_id: appointment.id,
        })
        .eq("id", credit.id);

      // Create payment record
      await supabase.from("payments").insert({
        client_id: user.id,
        psychologist_id: psychologistId,
        appointment_id: appointment.id,
        amount: 0,
        payment_type: "single_session",
        payment_status: "completed",
        currency: "MXN",
        description: "Sesión pagada con crédito de plataforma",
      });

      toast.success("Cita agendada con tu crédito disponible");
      navigate("/portal/sesiones");
    } catch (error: any) {
      console.error("Error booking with credit:", error);
      toast.error(error.message || "Error al agendar con crédito");
    } finally {
      setLoading(false);
    }
  };

  // Reserva usando una suscripción existiva (consume 1 sesión)
  const handleSubscriptionBooking = async (subscription: any) => {
    if (!user || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, pricing?.session_duration_minutes || 50);

      // Crear cita
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          psychologist_id: psychologistId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "pending",
          modality: "Videollamada",
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Determinar payment_type según el paquete
      const paymentType = subscription.sessions_total === 4 ? "package_4" : "package_8";

      // Registrar pago ligado a la suscripción (monto 0)
      const { error: paymentError } = await supabase.from("payments").insert({
        client_id: user.id,
        psychologist_id: psychologistId,
        appointment_id: appointment.id,
        subscription_id: subscription.id,
        amount: 0,
        payment_type: paymentType,
        payment_status: "completed",
        currency: "MXN",
        description: `Sesión ${subscription.sessions_used + 1} de ${subscription.sessions_total} del paquete`,
      });
      if (paymentError) throw paymentError;

      // Consumir 1 sesión de la suscripción
      const { error: subUpdateError } = await supabase
        .from("client_subscriptions")
        .update({
          sessions_used: subscription.sessions_used + 1,
          sessions_remaining: subscription.sessions_remaining - 1,
        })
        .eq("id", subscription.id);
      if (subUpdateError) throw subUpdateError;

      toast.success("Cita agendada usando tu suscripción");
      navigate("/portal/sesiones");
    } catch (error: any) {
      console.error("Error booking with subscription:", error);
      toast.error(error.message || "Error al agendar con suscripción");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingTypeConfirm = async (type: "single" | "package_4" | "package_8") => {
    if (!selectedDate || !selectedTime || !user) return;

    setLoading(true);
    try {
      console.log("Iniciando proceso de pago con Stripe", { type, psychologistId });
      
      const sessionStart = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      sessionStart.setHours(hours, minutes, 0, 0);

      const sessionEnd = new Date(sessionStart);
      sessionEnd.setMinutes(sessionEnd.getMinutes() + 50);

      // Create appointment first
      console.log("Creando cita...");
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          psychologist_id: psychologistId,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          status: "pending",
          modality: "Videollamada",
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("Error creando cita:", appointmentError);
        throw appointmentError;
      }

      console.log("Cita creada exitosamente:", appointment.id);
      setShowBookingDialog(false);

      // Map type to payment_type for backend
      const paymentTypeMap = {
        single: "single_session",
        package_4: "package_4",
        package_8: "package_8",
      };

      const paymentType = paymentTypeMap[type];
      console.log("Llamando a edge function con:", { 
        psychologist_id: psychologistId, 
        payment_type: paymentType, 
        appointment_id: appointment.id 
      });

      // Call Stripe checkout edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            psychologist_id: psychologistId,
            payment_type: paymentType,
            appointment_id: appointment.id,
          },
        }
      );

      if (checkoutError) {
        console.error("Error de checkout:", checkoutError);
        throw new Error(`Error al crear sesión de pago: ${checkoutError.message}`);
      }

      console.log("Respuesta de edge function:", checkoutData);

      if (!checkoutData?.url) {
        console.error("No se recibió URL de checkout. Data:", checkoutData);
        throw new Error("No se recibió URL de checkout de Stripe");
      }

      console.log("Redirigiendo a Stripe:", checkoutData.url);
      toast.success("Redirigiendo a Stripe Checkout...");
      
      // Redirect to Stripe Checkout
      setTimeout(() => {
        window.location.href = checkoutData.url;
      }, 500);
    } catch (error: any) {
      console.error("Error completo en booking:", error);
      toast.error(error.message || "Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Selecciona fecha y hora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              locale={es}
              className="rounded-md border pointer-events-auto"
            />
          </div>

          {selectedDate && (
            <>
              <div className="space-y-3">
                <Label>Horarios disponibles</Label>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay horarios disponibles para esta fecha
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {selectedTime && (
                <Button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Agendando..." : "Confirmar sesión"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {pricing && (
        <BookingTypeDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          pricing={pricing}
          onConfirm={handleBookingTypeConfirm}
        />
      )}
    </div>
  );
}
