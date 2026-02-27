import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AvailabilityEditor } from "@/components/therapist/AvailabilityEditor";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";

// ─── Constants ───────────────────────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END = 20;
const HOUR_HEIGHT = 72; // px per hour
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType = "vittare" | "external" | "blocked";

interface CalEvent {
  id: string;
  type: EventType;
  title: string;
  startHour: number;
  startMin: number;
  durationMin: number;
  date: Date;
  raw?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getWeekDates(offset: number): Date[] {
  const base = addDays(new Date(), offset * 7);
  const sunday = startOfWeek(base, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// ─── EventBlock ───────────────────────────────────────────────────────────────
function eventBg(type: EventType) {
  if (type === "vittare")
    return "bg-gradient-to-b from-green-400 to-green-600 text-white border-green-700";
  if (type === "external")
    return "bg-gradient-to-b from-blue-400 to-blue-600 text-white border-blue-700";
  return "bg-gray-100 text-gray-600 border-gray-400";
}

function EventBlock({
  event,
  onClick,
}: {
  event: CalEvent;
  onClick: (e: CalEvent) => void;
}) {
  const top =
    (event.startHour - HOUR_START) * HOUR_HEIGHT +
    (event.startMin / 60) * HOUR_HEIGHT;
  const height = Math.max((event.durationMin / 60) * HOUR_HEIGHT, 18);

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded border px-1 py-0.5 cursor-pointer overflow-hidden text-xs select-none ${eventBg(event.type)}`}
      style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
      onClick={() => onClick(event)}
      title={event.title}
    >
      {event.type === "blocked" && (
        <div
          className="absolute inset-0 rounded opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #6b7280 0, #6b7280 1px, transparent 0, transparent 50%)",
            backgroundSize: "8px 8px",
          }}
        />
      )}
      <span className="relative font-semibold leading-tight line-clamp-2 break-words">
        {event.title}
      </span>
    </div>
  );
}

// ─── AddBlockModal ────────────────────────────────────────────────────────────
function AddBlockModal({
  open,
  onClose,
  onSaved,
  psychologistId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  psychologistId: string;
}) {
  const [blockType, setBlockType] = useState<"external" | "blocked">("blocked");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [specificDate, setSpecificDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (timeToMins(endTime) <= timeToMins(startTime)) {
      toast.error("La hora de fin debe ser después del inicio");
      return;
    }
    setSaving(true);
    try {
      const record: any = {
        psychologist_id: psychologistId,
        block_type: blockType,
        label:
          label.trim() ||
          (blockType === "external" ? "Cita externa" : "Tiempo bloqueado"),
        notes: notes.trim() || null,
        start_time: startTime,
        end_time: endTime,
        is_recurring: isRecurring,
      };
      if (isRecurring) {
        record.day_of_week = parseInt(dayOfWeek);
      } else {
        record.specific_date = specificDate;
      }
      const { error } = await (supabase as any)
        .from("therapist_calendar_blocks")
        .insert(record);
      if (error) throw error;
      toast.success("Bloque guardado");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar bloque de tiempo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select
                value={blockType}
                onValueChange={(v) => setBlockType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">Cita externa</SelectItem>
                  <SelectItem value="blocked">Tiempo bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Frecuencia</Label>
              <Select
                value={isRecurring ? "yes" : "no"}
                onValueChange={(v) => setIsRecurring(v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Una vez</SelectItem>
                  <SelectItem value="yes">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                blockType === "external"
                  ? "Ej: Supervisión clínica"
                  : "Ej: Tiempo personal"
              }
            />
          </div>

          {isRecurring ? (
            <div className="space-y-1">
              <Label>Día de la semana</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_SHORT.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Inicio</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Fin</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── EventDetailModal ─────────────────────────────────────────────────────────
function EventDetailModal({
  event,
  onClose,
  onDelete,
}: {
  event: CalEvent | null;
  onClose: () => void;
  onDelete: (e: CalEvent) => void;
}) {
  if (!event) return null;

  const typeLabel =
    event.type === "vittare"
      ? "Sesión Vittare"
      : event.type === "external"
      ? "Cita externa"
      : "Tiempo bloqueado";

  const endMins = event.startHour * 60 + event.startMin + event.durationMin;
  const startLabel = `${pad2(event.startHour)}:${pad2(event.startMin)}`;
  const endLabel = `${pad2(Math.floor(endMins / 60))}:${pad2(endMins % 60)}`;

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-1 text-sm">
          <p>
            <span className="text-muted-foreground">Tipo: </span>
            {typeLabel}
          </p>
          <p>
            <span className="text-muted-foreground">Fecha: </span>
            {format(event.date, "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
          <p>
            <span className="text-muted-foreground">Horario: </span>
            {startLabel} – {endLabel}
          </p>
          {event.raw?.notes && (
            <p>
              <span className="text-muted-foreground">Notas: </span>
              {event.raw.notes}
            </p>
          )}
        </div>
        <DialogFooter>
          {(event.type === "external" || event.type === "blocked") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(event)}
            >
              Eliminar bloque
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TherapistCalendar() {
  const { user } = useAuth();
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<Date[]>(() => getWeekDates(0));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    setWeekDates(getWeekDates(weekOffset));
  }, [weekOffset]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("psychologist_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPsychologistId(data.id);
      });
  }, [user]);

  const fetchEvents = useCallback(async () => {
    if (!psychologistId || weekDates.length === 0) return;
    setLoading(true);
    try {
      const from = new Date(weekDates[0]);
      from.setHours(0, 0, 0, 0);
      const to = new Date(weekDates[6]);
      to.setHours(23, 59, 59, 999);

      // Vittare appointments
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, patient_id, status")
        .eq("psychologist_id", psychologistId)
        .gte("start_time", from.toISOString())
        .lte("start_time", to.toISOString())
        .neq("status", "cancelled");

      // Patient names
      const patientIds = [
        ...new Set(
          (appts || []).map((a: any) => a.patient_id).filter(Boolean)
        ),
      ];
      let names: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds);
        names = Object.fromEntries(
          (profs || []).map((p: any) => [p.id, p.full_name])
        );
      }

      // Calendar blocks — two queries: recurring + specific dates this week
      const dateStrings = weekDates.map((d) => format(d, "yyyy-MM-dd"));
      const [{ data: recurring }, { data: specific }] = await Promise.all([
        (supabase as any)
          .from("therapist_calendar_blocks")
          .select("*")
          .eq("psychologist_id", psychologistId)
          .eq("is_recurring", true),
        (supabase as any)
          .from("therapist_calendar_blocks")
          .select("*")
          .eq("psychologist_id", psychologistId)
          .eq("is_recurring", false)
          .in("specific_date", dateStrings),
      ]);

      const calEvents: CalEvent[] = [];

      // Appointments → vittare events
      for (const appt of appts || []) {
        const start = new Date(appt.start_time);
        const end = new Date(appt.end_time);
        const durationMin =
          Math.round((end.getTime() - start.getTime()) / 60000) || 50;
        calEvents.push({
          id: appt.id,
          type: "vittare",
          title: names[appt.patient_id] || "Paciente",
          startHour: start.getHours(),
          startMin: start.getMinutes(),
          durationMin,
          date: start,
          raw: appt,
        });
      }

      // Recurring blocks — one entry per matching weekday
      for (const block of recurring || []) {
        for (const date of weekDates) {
          if (date.getDay() === block.day_of_week) {
            const sm = timeToMins(block.start_time);
            const em = timeToMins(block.end_time);
            calEvents.push({
              id: `rblock-${block.id}-${format(date, "yyyy-MM-dd")}`,
              type: block.block_type as EventType,
              title:
                block.label ||
                (block.block_type === "external" ? "Cita externa" : "Bloqueado"),
              startHour: Math.floor(sm / 60),
              startMin: sm % 60,
              durationMin: em - sm,
              date,
              raw: block,
            });
          }
        }
      }

      // Specific-date blocks
      for (const block of specific || []) {
        const matchDate = weekDates.find(
          (d) => format(d, "yyyy-MM-dd") === block.specific_date
        );
        if (!matchDate) continue;
        const sm = timeToMins(block.start_time);
        const em = timeToMins(block.end_time);
        calEvents.push({
          id: `sblock-${block.id}`,
          type: block.block_type as EventType,
          title:
            block.label ||
            (block.block_type === "external" ? "Cita externa" : "Bloqueado"),
          startHour: Math.floor(sm / 60),
          startMin: sm % 60,
          durationMin: em - sm,
          date: matchDate,
          raw: block,
        });
      }

      setEvents(calEvents);
    } catch (err) {
      console.error("Error loading calendar:", err);
    } finally {
      setLoading(false);
    }
  }, [psychologistId, weekDates]);

  useEffect(() => {
    if (psychologistId && weekDates.length > 0) fetchEvents();
  }, [psychologistId, weekDates, fetchEvents]);

  // Scroll to current hour on first load only
  useEffect(() => {
    if (!loading && !scrolledRef.current && scrollRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - HOUR_START - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
      scrolledRef.current = true;
    }
  }, [loading]);

  const handleDeleteBlock = async (event: CalEvent) => {
    if (!event.raw?.id) return;
    try {
      const { error } = await (supabase as any)
        .from("therapist_calendar_blocks")
        .delete()
        .eq("id", event.raw.id);
      if (error) throw error;
      toast.success("Bloque eliminado");
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error("Error al eliminar: " + err.message);
    }
  };

  const eventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(e.date, date));

  const weekLabel =
    weekDates.length === 7
      ? `${format(weekDates[0], "d MMM", { locale: es })} – ${format(
          weekDates[6],
          "d MMM yyyy",
          { locale: es }
        )}`
      : "";

  // ── Availability editor view ─────────────────────────────────────────────
  if (showEditor && psychologistId) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>
          ← Volver al calendario
        </Button>
        <AvailabilityEditor
          psychologistId={psychologistId}
          onClose={() => setShowEditor(false)}
        />
      </div>
    );
  }

  // ── Calendar view ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none h-8 w-8"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none h-8 px-3 text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none h-8 w-8"
              onClick={() => setWeekOffset((w) => w + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {psychologistId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar bloque
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEditor(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Configurar horario
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-hidden flex flex-col flex-1 min-h-0 bg-background">
        {/* Day header row */}
        <div
          className="grid border-b bg-muted/30 flex-shrink-0"
          style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
        >
          <div />
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-2 border-l text-xs font-medium ${
                isToday(date) ? "bg-primary/10" : ""
              }`}
            >
              <span className="text-muted-foreground">{DAY_SHORT[date.getDay()]}</span>
              <span
                className={`mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                  isToday(date)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {format(date, "d")}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div ref={scrollRef} className="overflow-y-auto flex-1">
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: "48px repeat(7, 1fr)",
              height: `${(HOUR_END - HOUR_START) * HOUR_HEIGHT}px`,
            }}
          >
            {/* Time labels */}
            <div className="relative select-none">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-xs text-muted-foreground leading-none"
                  style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT - 6}px` }}
                >
                  {`${pad2(h)}:00`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((date, i) => (
              <div
                key={i}
                className={`relative border-l ${
                  isToday(date) ? "bg-primary/[0.03]" : ""
                }`}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-border/40"
                    style={{ top: `${(h - HOUR_START) * HOUR_HEIGHT}px` }}
                  />
                ))}
                {/* Half-hour dashed lines */}
                {HOURS.map((h) => (
                  <div
                    key={`${h}h`}
                    className="absolute w-full border-t border-border/20 border-dashed"
                    style={{
                      top: `${(h - HOUR_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`,
                    }}
                  />
                ))}
                {/* Events */}
                {eventsForDay(date).map((ev) => (
                  <EventBlock key={ev.id} event={ev} onClick={setSelectedEvent} />
                ))}
              </div>
            ))}

            {/* Now line */}
            {(() => {
              const now = new Date();
              const idx = weekDates.findIndex((d) => isSameDay(d, now));
              if (idx === -1) return null;
              const frac = now.getHours() + now.getMinutes() / 60;
              if (frac < HOUR_START || frac >= HOUR_END) return null;
              const top = (frac - HOUR_START) * HOUR_HEIGHT;
              return (
                <div
                  className="absolute z-20 pointer-events-none flex items-center"
                  style={{
                    top: `${top}px`,
                    left: `calc(48px + ${idx} * ((100% - 48px) / 7))`,
                    width: `calc((100% - 48px) / 7)`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 -ml-1" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-b from-green-400 to-green-600" />
          <span>Sesión Vittare</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-b from-blue-400 to-blue-600" />
          <span>Cita externa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded border border-gray-400"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #9ca3af 0, #9ca3af 1px, transparent 0, transparent 50%)",
              backgroundSize: "6px 6px",
            }}
          />
          <span>Tiempo bloqueado</span>
        </div>
      </div>

      {/* Modals */}
      {psychologistId && (
        <AddBlockModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchEvents}
          psychologistId={psychologistId}
        />
      )}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={handleDeleteBlock}
      />
    </div>
  );
}
