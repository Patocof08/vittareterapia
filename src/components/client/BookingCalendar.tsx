import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Video, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format, addMinutes, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface BookingCalendarProps {
  psychologistId: string;
  psychologistName: string;
  sessionPrice: number;
  sessionDuration: number;
  modalities: string[];
  onBookingComplete?: () => void;
}

export function BookingCalendar({
  psychologistId,
  psychologistName,
  sessionPrice,
  sessionDuration,
  modalities,
  onBookingComplete
}: BookingCalendarProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedModality, setSelectedModality] = useState(modalities[0] || "Videollamada");
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Date[]>([]);

  // Cargar disponibilidad y citas existentes
  useEffect(() => {
    if (!selectedDate) return;
    loadAvailableSlots();
  }, [selectedDate, psychologistId]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      const dayOfWeek = selectedDate.getDay();
      
      // Obtener horarios recurrentes del psicólogo
      const { data: availability, error: availError } = await supabase
        .from("psychologist_availability")
        .select("start_time, end_time")
        .eq("psychologist_id", psychologistId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_exception", false);

      if (availError) throw availError;

      // Obtener excepciones para esta fecha específica
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data: exceptions } = await supabase
        .from("psychologist_availability")
        .select("*")
        .eq("psychologist_id", psychologistId)
        .eq("exception_date", dateStr)
        .eq("is_exception", true);

      // Si hay excepción para este día, no hay disponibilidad
      if (exceptions && exceptions.length > 0) {
        setAvailableSlots([]);
        return;
      }

      // Obtener citas ya agendadas para este día
      const startOfDayDate = startOfDay(selectedDate);
      const endOfDayDate = endOfDay(selectedDate);

      const { data: appointments, error: apptError } = await supabase
        .from("appointments")
        .select("start_time, end_time")
        .eq("psychologist_id", psychologistId)
        .gte("start_time", startOfDayDate.toISOString())
        .lte("start_time", endOfDayDate.toISOString())
        .in("status", ["pending", "confirmed"]);

      if (apptError) throw apptError;

      // Convertir citas a array de fechas
      const booked = appointments?.flatMap(apt => {
        const slots: Date[] = [];
        let current = parseISO(apt.start_time);
        const end = parseISO(apt.end_time);
        while (current < end) {
          slots.push(new Date(current));
          current = addMinutes(current, sessionDuration);
        }
        return slots;
      }) || [];

      setBookedSlots(booked);

      // Generar slots disponibles
      const slots: Date[] = [];
      availability?.forEach(block => {
        const [startHour, startMin] = block.start_time.split(":").map(Number);
        const [endHour, endMin] = block.end_time.split(":").map(Number);

        let current = new Date(selectedDate);
        current.setHours(startHour, startMin, 0, 0);

        const blockEnd = new Date(selectedDate);
        blockEnd.setHours(endHour, endMin, 0, 0);

        while (current < blockEnd) {
          // Solo incluir si no está ocupado y es futuro
          const isBooked = booked.some(b => 
            Math.abs(b.getTime() - current.getTime()) < 60000
          );
          const isFuture = current > new Date();
          
          if (!isBooked && isFuture) {
            slots.push(new Date(current));
          }
          current = addMinutes(current, sessionDuration);
        }
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Error al cargar disponibilidad");
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !user) {
      toast.error("Selecciona un horario");
      return;
    }

    setLoading(true);
    try {
      const endTime = addMinutes(selectedSlot, sessionDuration);

      const { error } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          psychologist_id: psychologistId,
          start_time: selectedSlot.toISOString(),
          end_time: endTime.toISOString(),
          status: "confirmed",
          modality: selectedModality
        });

      if (error) throw error;

      toast.success("¡Sesión agendada exitosamente!");
      setSelectedSlot(null);
      loadAvailableSlots();
      onBookingComplete?.();
    } catch (error: any) {
      console.error("Error booking:", error);
      toast.error("Error al agendar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Calendario */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona una fecha</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            locale={es}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Horarios disponibles */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Horarios disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <p className="text-sm text-muted-foreground mb-4">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Modalidad</label>
              <Select value={selectedModality} onValueChange={setSelectedModality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modalities.map(mod => (
                    <SelectItem key={mod} value={mod}>
                      {mod === "Videollamada" ? (
                        <span className="flex items-center gap-2">
                          <Video className="w-4 h-4" /> {mod}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {mod}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay horarios disponibles para esta fecha
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableSlots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant={selectedSlot?.getTime() === slot.getTime() ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {format(slot, "HH:mm")} - {format(addMinutes(slot, sessionDuration), "HH:mm")}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        {selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Psicólogo</p>
                <p className="font-medium">{psychologistName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha y hora</p>
                <p className="font-medium">
                  {format(selectedSlot, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duración</p>
                <p className="font-medium">{sessionDuration} minutos</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modalidad</p>
                <p className="font-medium">{selectedModality}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio</p>
                <p className="font-medium text-lg">${sessionPrice} MXN</p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleBooking}
                disabled={loading}
              >
                {loading ? "Agendando..." : "Confirmar reserva"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
