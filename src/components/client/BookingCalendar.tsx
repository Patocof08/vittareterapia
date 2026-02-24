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

        if (type === "single") {
          // Create single appointment
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

          // Create payment record for individual session
          const basePrice = pricing?.session_price || 0;
          const platformFee = Math.round(basePrice * feeRate * 100) / 100;
          const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert({
              client_id: user.id,
              psychologist_id: psychologistId,
              appointment_id: appointment.id,
              base_amount: basePrice,
              platform_fee_rate: feeRate,
              platform_fee: platformFee,
              amount: basePrice + platformFee,
              payment_type: "single_session",
              payment_status: "pending",
              currency: "MXN",
              description: "Sesión individual",
            })
            .select()
            .single();

          if (paymentError) throw paymentError;

          // Crear ingreso diferido para la sesión individual (monto base, sin fee)
          const { error: deferredError } = await supabase.rpc("create_single_session_deferred", {
            _appointment_id: appointment.id,
            _payment_id: payment.id,
            _psychologist_id: psychologistId,
            _amount: basePrice,
          });
          if (deferredError) {
            console.error("Error al crear ingreso diferido:", deferredError);
            toast.error("La cita fue agendada pero hubo un error al registrar el pago. Contacta a soporte.");
          }

          // Registrar platform fee en admin wallet
          if (!deferredError && platformFee > 0) {
            await supabase.rpc("record_platform_fee", {
              _payment_id: payment.id,
              _psychologist_id: psychologistId,
              _fee_amount: platformFee,
            });
          }

          toast.success("Cita agendada con éxito");
          navigate("/portal/sesiones");
        } else {
          // Package booking - process directly
          const sessionsTotal = type === "package_4" ? 4 : 8;
          const packagePrice = type === "package_4" ? pricing?.package_4_price : pricing?.package_8_price;
          const paymentType = type === "package_4" ? "package_4" : "package_8";
          const packageTypeValue = type === "package_4" ? "4_sessions" : "8_sessions";

          const regularPrice = (pricing?.session_price || 0) * sessionsTotal;
          const discountPercentage = regularPrice > 0
            ? Math.round(((regularPrice - (packagePrice || 0)) / regularPrice) * 100)
            : 0;

          // 1. Create payment
          const basePackagePrice = packagePrice || 0;
          const packagePlatformFee = Math.round(basePackagePrice * feeRate * 100) / 100;
          const { data: payment, error: paymentError } = await supabase.from("payments").insert({
            client_id: user.id,
            psychologist_id: psychologistId,
            base_amount: basePackagePrice,
            platform_fee_rate: feeRate,
            platform_fee: packagePlatformFee,
            amount: basePackagePrice + packagePlatformFee,
            payment_type: paymentType,
            payment_status: "completed",
            completed_at: new Date().toISOString(),
            payment_method: "Transferencia/Efectivo",
            currency: "MXN",
            description: `Paquete de ${sessionsTotal} sesiones`,
          }).select().single();
          if (paymentError) throw paymentError;

          // 2. Create subscription
          const { data: subscription, error: subError } = await supabase.from("client_subscriptions").insert({
            client_id: user.id,
            psychologist_id: psychologistId,
            session_price: pricing?.session_price || 0,
            discount_percentage: discountPercentage,
            sessions_total: sessionsTotal,
            sessions_used: 1,
            sessions_remaining: sessionsTotal - 1,
            package_type: packageTypeValue,
            status: "active",
            auto_renew: true,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }).select().single();
          if (subError) throw subError;

          // 3. Create deferred revenue for entire package (monto base, sin fee)
          await supabase.rpc("create_deferred_revenue", {
            _psychologist_id: psychologistId,
            _appointment_id: null,
            _subscription_id: subscription.id,
            _payment_id: payment.id,
            _amount: basePackagePrice,
          });

          // Registrar platform fee en admin wallet
          if (packagePlatformFee > 0) {
            await supabase.rpc("record_platform_fee", {
              _payment_id: payment.id,
              _psychologist_id: psychologistId,
              _fee_amount: packagePlatformFee,
            });
          }

          // 4. Create first appointment with subscription_id
          const { data: appointment, error: apptError } = await supabase.from("appointments").insert({
            patient_id: user.id,
            psychologist_id: psychologistId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "pending",
            modality: "Videollamada",
            subscription_id: subscription.id,
          }).select().single();
          if (apptError) throw apptError;

          // 5. Update payment with appointment and subscription
          await supabase.from("payments").update({
            subscription_id: subscription.id,
            appointment_id: appointment.id,
          }).eq("id", payment.id);

          // 6. Create invoice
          await supabase.from("invoices").insert({
            payment_id: payment.id,
            client_id: user.id,
            psychologist_id: psychologistId,
            amount: basePackagePrice + packagePlatformFee,
            invoice_number: '',
          });

          toast.success(`¡Paquete de ${sessionsTotal} sesiones adquirido con éxito!`);
          navigate("/portal/sesiones");
        }
    } catch (error: any) {
      console.error("Error booking:", error);
      toast.error(error.message || "Error al procesar la reserva");
    } finally {
      setLoading(false);
      setShowBookingDialog(false);
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
    </div>
  );
}
