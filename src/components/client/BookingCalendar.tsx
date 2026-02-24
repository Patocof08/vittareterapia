import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addMinutes, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BookingTypeDialog } from "@/components/client/BookingTypeDialog";
import { StripePaymentForm } from "@/components/client/StripePaymentForm";
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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const feeRate = 0.05; // Cargo por servicio de la plataforma (5%)
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
      const now = new Date();
      const minimumBookingTime = addMinutes(now, 6 * 60); // 6 hours from now

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

            // Skip if slot is less than 6 hours from now
            if (slotStart < minimumBookingTime) {
              current = addMinutes(current, 60);
              continue;
            }

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

      const { data: appointmentId, error } = await supabase.rpc("book_with_credit", {
        _credit_id: credit.id,
        _patient_id: user.id,
        _psychologist_id: psychologistId,
        _start_time: startTime.toISOString(),
        _end_time: endTime.toISOString(),
        _modality: "Videollamada",
      });

      if (error) throw error;

      toast.success("Cita agendada con tu crédito disponible");
      navigate("/portal/sesiones");
    } catch (error: any) {
      console.error("Error al agendar con crédito:", error);
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
          subscription_id: subscription.id,
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Determinar payment_type según el paquete
      const paymentType = subscription.sessions_total === 4 ? "package_4" : "package_8";

      // Obtener precio individual del psicólogo
      const { data: pricingData } = await supabase
        .from("psychologist_pricing")
        .select("session_price")
        .eq("psychologist_id", psychologistId)
        .single();

      const sessionPrice = pricingData?.session_price || 0;

      // Registrar pago ligado a la suscripción
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          client_id: user.id,
          psychologist_id: psychologistId,
          appointment_id: appointment.id,
          subscription_id: subscription.id,
          base_amount: sessionPrice,
          platform_fee_rate: 0,
          platform_fee: 0,
          amount: sessionPrice,
          payment_type: paymentType,
          payment_status: "pending",
          currency: "MXN",
          description: `Sesión ${subscription.sessions_used + 1} de ${subscription.sessions_total} del paquete`,
        })
        .select()
        .single();

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
    if (!user || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, pricing?.session_duration_minutes || 50);

      const paymentTypeMap = {
        single: "single_session",
        package_4: "package_4",
        package_8: "package_8",
      } as const;

      const baseAmountMap = {
        single: pricing?.session_price || 0,
        package_4: pricing?.package_4_price || 0,
        package_8: pricing?.package_8_price || 0,
      };

      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error("No se pudo obtener la sesión de usuario");

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({
          psychologist_id: psychologistId,
          payment_type: paymentTypeMap[type],
          base_amount: baseAmountMap[type],
          appointment_data: {
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al iniciar el pago");
      }

      setClientSecret(data.clientSecret);
      setShowBookingDialog(false);
      setShowPaymentForm(true);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast.error(error.message || "Error al iniciar el pago");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
    navigate("/portal/sesiones");
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
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
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const checkDate = new Date(date);
                checkDate.setHours(0, 0, 0, 0);
                return checkDate < today;
              }}
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
          feeRate={feeRate}
          onConfirm={handleBookingTypeConfirm}
        />
      )}

      <Dialog open={showPaymentForm} onOpenChange={(open) => { if (!open) handlePaymentCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Completa tu pago</DialogTitle>
          </DialogHeader>
          {clientSecret && (
            <StripePaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
