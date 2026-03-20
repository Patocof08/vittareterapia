import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Plus, Trash2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";

const daysOfWeek = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
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
    setTimeSlots([...timeSlots, { day_of_week: 1, start_time: "09:00", end_time: "13:00" }]);
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
      session_duration_minutes: 50,
      minimum_notice_hours: 6,
      reschedule_window_hours: 12,
      availability: timeSlots,
    });
    await saveAvailability(timeSlots);
    nextStep();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1 pb-1">
        <h2 className="ob-heading text-2xl font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
          Tu horario de atención
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          Define cuándo estás disponible. Los clientes podrán reservar según tu agenda.
        </p>
      </div>

      {/* ── Session policies ── */}
      <div className="ob-info-box">
        <p className="font-semibold mb-2 text-sm" style={{ color: "var(--ob-primary-dark)" }}>
          Políticas de sesión
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["⏱", "Duración", "50 min"],
            ["⏰", "Aviso mínimo", "6 horas"],
            ["📅", "Reagendamiento", "12 horas antes"],
            ["🕐", "Tolerancia", "10 minutos"],
          ].map(([icon, label, value]) => (
            <div key={label} className="space-y-0.5">
              <div className="text-base">{icon}</div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ob-muted)" }}>
                {label}
              </div>
              <div className="text-xs font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Time slots ── */}
      <div className="ob-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="ob-section-title">Mis horarios disponibles</p>
          <button
            type="button"
            onClick={addTimeSlot}
            className="flex items-center gap-1.5 text-sm font-medium transition-all"
            style={{ color: "var(--ob-primary)" }}
          >
            <Plus className="w-4 h-4" />
            Agregar bloque
          </button>
        </div>

        <div className="space-y-3">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="rounded-xl p-4"
              style={{
                background: index % 2 === 0 ? "var(--ob-surface)" : "rgba(127,207,194,0.06)",
                border: "1px solid var(--ob-border)",
              }}
            >
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="ob-label">Día</label>
                  <Select
                    value={slot.day_of_week.toString()}
                    onValueChange={(value) =>
                      updateTimeSlot(index, "day_of_week", parseInt(value))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white border-[var(--ob-border)] text-sm">
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

                <div className="flex-1 space-y-1.5">
                  <label className="ob-label">Inicio</label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                      style={{ color: "var(--ob-placeholder)" }}
                    />
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(index, "start_time", e.target.value)}
                      className="ob-input pl-9"
                      style={{ fontSize: "0.875rem" }}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="ob-label">Fin</label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                      style={{ color: "var(--ob-placeholder)" }}
                    />
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(index, "end_time", e.target.value)}
                      className="ob-input pl-9"
                      style={{ fontSize: "0.875rem" }}
                    />
                  </div>
                </div>

                {timeSlots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(index)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all mb-0"
                    style={{ background: "#fce7ed", color: "#c0365c" }}
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2">
        <button onClick={prevStep} className="ob-btn-ghost flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <button onClick={handleNext} className="ob-btn-primary flex items-center gap-2">
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
