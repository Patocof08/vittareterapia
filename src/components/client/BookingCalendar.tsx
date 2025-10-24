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

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !user) {
      toast.error("Por favor selecciona fecha y hora");
      return;
    }
    setShowBookingDialog(true);
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
        const { error } = await supabase.from("appointments").insert({
          patient_id: user.id,
          psychologist_id: psychologistId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "pending",
          modality: "Videollamada",
        });

        if (error) throw error;
        toast.success("Cita agendada con éxito");
        navigate("/portal/sesiones");
      } else {
        // Create subscription with package
        const sessionsTotal = type === "package_4" ? 4 : 8;
        const packagePrice = type === "package_4" ? pricing?.package_4_price : pricing?.package_8_price;
        const regularPrice = (pricing?.session_price || 0) * sessionsTotal;
        const discountPercentage = Math.round(((regularPrice - packagePrice) / regularPrice) * 100);
        const packageTypeValue = type === "package_4" ? "4_sessions" : "8_sessions";

        const { data: subscription, error: subError } = await supabase
          .from("client_subscriptions")
          .insert({
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
          })
          .select()
          .single();

        if (subError) throw subError;

        // Create first appointment
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

        // Create payment record linking appointment to subscription
        const { error: paymentError } = await supabase.from("payments").insert({
          client_id: user.id,
          psychologist_id: psychologistId,
          appointment_id: appointment.id,
          subscription_id: subscription.id,
          amount: 0, // Already paid as part of subscription
          payment_type: "subscription",
          payment_status: "completed",
          currency: "MXN",
          description: `Sesión ${1} de ${sessionsTotal} del paquete`,
        });

        if (paymentError) throw paymentError;

        toast.success(`Paquete de ${sessionsTotal} sesiones adquirido y primera cita agendada`);
        navigate("/portal/suscripciones");
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
