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

interface BookingCalendarProps {
  psychologistId: string;
}

export function BookingCalendar({ psychologistId }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [modality, setModality] = useState<"online" | "presencial">("online");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, 50);

      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase.from("appointments").insert({
        patient_id: user.id,
        psychologist_id: psychologistId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "pending",
        modality,
      });

      if (error) throw error;

      toast.success("Cita agendada con éxito");
      setSelectedDate(undefined);
      setSelectedTime("");
    } catch (error: any) {
      console.error("Error booking:", error);
      toast.error(error.message || "Error al agendar la cita");
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
                <Label>Modalidad</Label>
                <RadioGroup value={modality} onValueChange={(v: any) => setModality(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online">Videollamada</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="presencial" id="presencial" />
                    <Label htmlFor="presencial">Presencial</Label>
                  </div>
                </RadioGroup>
              </div>

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
    </div>
  );
}
