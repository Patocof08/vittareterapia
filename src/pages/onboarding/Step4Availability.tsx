import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const daysOfWeek = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

interface TimeSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export const Step4Availability = () => {
  const { data, updateData, nextStep, prevStep, saveAvailability } = useOnboardingContext();
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    data.availability || [{ day_of_week: 1, start_time: "09:00", end_time: "13:00" }]
  );

  const addTimeSlot = () => {
    setTimeSlots([
      ...timeSlots,
      { day_of_week: 1, start_time: "09:00", end_time: "13:00" },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const validateTimeSlots = () => {
    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      if (slot.start_time >= slot.end_time) {
        toast.error(`La hora de inicio debe ser menor que la hora de fin (Bloque ${i + 1})`);
        return false;
      }
      
      // Check for overlaps
      for (let j = i + 1; j < timeSlots.length; j++) {
        const other = timeSlots[j];
        if (slot.day_of_week === other.day_of_week) {
          if (
            (slot.start_time < other.end_time && slot.end_time > other.start_time) ||
            (other.start_time < slot.end_time && other.end_time > slot.start_time)
          ) {
            toast.error(`Hay un solapamiento entre bloques en ${daysOfWeek[slot.day_of_week]}`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (timeSlots.length === 0) {
      toast.error("Debes agregar al menos un bloque de disponibilidad");
      return;
    }

    if (!validateTimeSlots()) return;

    // Use fixed universal values for session parameters
    updateData({
      session_duration_minutes: 50,
      minimum_notice_hours: 6,
      reschedule_window_hours: 12,
      availability: timeSlots,
    });

    await saveAvailability(timeSlots);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad y agenda</CardTitle>
          <CardDescription>
            Configure your weekly schedule and session parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Políticas universales */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Políticas de reserva y sesiones:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Duración de sesión: 50 minutos</li>
              <li>• Reserva con mínimo 6 horas de anticipación</li>
              <li>• Cancelaciones: 12 horas antes de la cita</li>
            </ul>
          </div>

          {/* Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bloques de disponibilidad *</Label>
              <Button variant="outline" size="sm" onClick={addTimeSlot}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar bloque
              </Button>
            </div>

            {timeSlots.map((slot, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label>Día de la semana</Label>
                        <Select
                          value={slot.day_of_week.toString()}
                          onValueChange={(value) =>
                            updateTimeSlot(index, "day_of_week", parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Hora inicio</Label>
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              updateTimeSlot(index, "start_time", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hora fin</Label>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              updateTimeSlot(index, "end_time", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {timeSlots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                        className="mt-8"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button onClick={handleNext}>Siguiente</Button>
      </div>
    </div>
  );
};
