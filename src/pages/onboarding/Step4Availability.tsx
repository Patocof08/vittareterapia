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
  
  const [sessionDuration, setSessionDuration] = useState(
    data.session_duration_minutes?.toString() || "50"
  );
  const [minNotice, setMinNotice] = useState(data.minimum_notice_hours?.toString() || "24");
  const [rescheduleWindow, setRescheduleWindow] = useState(
    data.reschedule_window_hours?.toString() || "24"
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { day_of_week: 1, start_time: "09:00", end_time: "13:00" },
  ]);

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

    updateData({
      session_duration_minutes: parseInt(sessionDuration),
      minimum_notice_hours: parseInt(minNotice),
      reschedule_window_hours: parseInt(rescheduleWindow),
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
          {/* Session Duration */}
          <div className="space-y-3">
            <Label>Duración de sesión *</Label>
            <RadioGroup value={sessionDuration} onValueChange={setSessionDuration}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="45" id="duration-45" />
                <Label htmlFor="duration-45" className="font-normal cursor-pointer">
                  45 minutos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="50" id="duration-50" />
                <Label htmlFor="duration-50" className="font-normal cursor-pointer">
                  50 minutos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="60" id="duration-60" />
                <Label htmlFor="duration-60" className="font-normal cursor-pointer">
                  60 minutos
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Minimum Notice */}
          <div className="space-y-3">
            <Label>Tiempo mínimo de anticipación para reservar *</Label>
            <RadioGroup value={minNotice} onValueChange={setMinNotice}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="notice-2" />
                <Label htmlFor="notice-2" className="font-normal cursor-pointer">
                  2 horas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="12" id="notice-12" />
                <Label htmlFor="notice-12" className="font-normal cursor-pointer">
                  12 horas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24" id="notice-24" />
                <Label htmlFor="notice-24" className="font-normal cursor-pointer">
                  24 horas
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reschedule Window */}
          <div className="space-y-3">
            <Label>Ventana de reprogramación/cancelación *</Label>
            <RadioGroup value={rescheduleWindow} onValueChange={setRescheduleWindow}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="12" id="window-12" />
                <Label htmlFor="window-12" className="font-normal cursor-pointer">
                  12 horas antes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24" id="window-24" />
                <Label htmlFor="window-24" className="font-normal cursor-pointer">
                  24 horas antes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="48" id="window-48" />
                <Label htmlFor="window-48" className="font-normal cursor-pointer">
                  48 horas antes
                </Label>
              </div>
            </RadioGroup>
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
