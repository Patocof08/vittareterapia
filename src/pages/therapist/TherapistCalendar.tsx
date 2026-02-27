import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AvailabilityEditor } from "@/components/therapist/AvailabilityEditor";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";

// ─── Constants ───────────────────────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END = 20;
const HOUR_HEIGHT = 72;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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

// ─── Event configs ────────────────────────────────────────────────────────────
const EVENT_CONFIGS: Record<EventType, { bg: string; border: string; text: string }> = {
  vittare: {
    bg: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
    border: "#064e3b",
    text: "#ecfdf5",
  },
  external: {
    bg: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
    border: "#172554",
    text: "#eff6ff",
  },
  blocked: {
    bg: "repeating-linear-gradient(135deg, #f1f5f9, #f1f5f9 4px, #e2e8f0 4px, #e2e8f0 8px)",
    border: "#cbd5e1",
    text: "#64748b",
  },
};

// ─── NowLine ──────────────────────────────────────────────────────────────────
function NowLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);
  const h = now.getHours(), m = now.getMinutes();
  if (h < HOUR_START || h >= HOUR_END) return null;
  const top = (h - HOUR_START) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
  return (
    <div
      style={{
        position: "absolute",
        top: `${top}px`,
        left: 0,
        right: 0,
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-5px",
          top: "-5px",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "#ef4444",
        }}
      />
      <div
        style={{
          height: "2px",
          background: "#ef4444",
          boxShadow: "0 0 8px rgba(239,68,68,0.4)",
        }}
      />
    </div>
  );
}

// ─── EventBlock ───────────────────────────────────────────────────────────────
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
  const height = Math.max((event.durationMin / 60) * HOUR_HEIGHT, 28);
  const cfg = EVENT_CONFIGS[event.type];
  const isPending = event.raw?.status === "pending";
  const isRecurring = event.raw?.is_recurring;

  return (
    <div
      onClick={() => onClick(event)}
      style={{
        position: "absolute",
        top: `${top}px`,
        left: "4px",
        right: "4px",
        height: `${height - 2}px`,
        background: cfg.bg,
        borderLeft: `3px solid ${cfg.border}`,
        borderRadius: "6px",
        padding: "4px 8px",
        cursor: "pointer",
        zIndex: 10,
        overflow: "hidden",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        opacity: isPending ? 0.85 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        (e.currentTarget.style as any).zIndex = "20";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        (e.currentTarget.style as any).zIndex = "10";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: cfg.text,
            letterSpacing: "-0.01em",
          }}
        >
          {`${pad2(event.startHour)}:${pad2(event.startMin)}`}
        </span>
        {isRecurring && (
          <span style={{ fontSize: "9px", opacity: 0.8, color: cfg.text }}>↻</span>
        )}
        {isPending && (
          <span
            style={{
              fontSize: "8px",
              background: "rgba(255,255,255,0.3)",
              padding: "1px 5px",
              borderRadius: "4px",
              color: cfg.text,
              fontWeight: 600,
            }}
          >
            PEND
          </span>
        )}
      </div>
      {height > 36 && (
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: cfg.text,
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {event.title}
        </div>
      )}
      {height > 56 && (
        <div
          style={{ fontSize: "10px", color: cfg.text, opacity: 0.75, marginTop: "2px" }}
        >
          {event.durationMin} min
        </div>
      )}
    </div>
  );
}

// ─── AddBlockModal ────────────────────────────────────────────────────────────
function AddBlockModal({
  open,
  onClose,
  onSaved,
  psychologistId,
  initialDayOfWeek,
  initialHour,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  psychologistId: string;
  initialDayOfWeek?: number;
  initialHour?: number;
}) {
  const [blockType, setBlockType] = useState<"external" | "blocked">("blocked");
  const [label, setLabel] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState(String(initialDayOfWeek ?? 1));
  const [specificDate, setSpecificDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startHour, setStartHour] = useState(initialHour ?? 9);
  const [startMin, setStartMin] = useState(0);
  const [durationMin, setDurationMin] = useState(60);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialDayOfWeek !== undefined) setDayOfWeek(String(initialDayOfWeek));
    if (initialHour !== undefined) setStartHour(initialHour);
  }, [initialDayOfWeek, initialHour]);

  if (!open) return null;

  const endTotalMins = startHour * 60 + startMin + durationMin;
  const endH = Math.floor(endTotalMins / 60);
  const endM = endTotalMins % 60;

  const handleSave = async () => {
    if (endTotalMins <= startHour * 60 + startMin) {
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
          (blockType === "external" ? "Cita externa" : "Bloqueado"),
        start_time: `${pad2(startHour)}:${pad2(startMin)}`,
        end_time: `${pad2(endH)}:${pad2(endM)}`,
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

  const inputSt: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "white",
  };
  const selectSt: React.CSSProperties = {
    width: "100%",
    padding: "10px 8px",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "13px",
    fontFamily: "inherit",
    background: "white",
    cursor: "pointer",
    outline: "none",
  };

  const typeConfigs = {
    external: { label: "Cita externa", icon: "📌", desc: "Consulta fuera de Vittare" },
    blocked: { label: "Bloquear horario", icon: "🚫", desc: "No disponible para citas" },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "16px",
          width: "min(420px, 92vw)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Agregar al calendario
          </h3>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              background: "#f1f5f9",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Type card selector */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {(
              Object.entries(typeConfigs) as [
                "external" | "blocked",
                (typeof typeConfigs)[keyof typeof typeConfigs]
              ][]
            ).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setBlockType(key)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border:
                    blockType === key
                      ? "2px solid #10b981"
                      : "2px solid #e2e8f0",
                  background: blockType === key ? "#f0fdf4" : "white",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                  {cfg.icon}
                </div>
                <div
                  style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}
                >
                  {cfg.label}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  {cfg.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Label */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                display: "block",
                marginBottom: "6px",
              }}
            >
              {blockType === "external"
                ? "Nombre o paciente"
                : "Motivo (opcional)"}
            </label>
            <input
              type="text"
              placeholder={
                blockType === "external"
                  ? "Ej: Supervisión, Juan Pérez..."
                  : "Ej: Comida, Personal..."
              }
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={inputSt}
            />
          </div>

          {/* Day + Start + Duration */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Día
              </label>
              {isRecurring ? (
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  style={selectSt}
                >
                  {DAY_FULL.map((d, i) => (
                    <option key={i} value={String(i)}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  style={{ ...inputSt, padding: "9px 8px" }}
                />
              )}
            </div>
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Inicio
              </label>
              <select
                value={`${startHour}:${startMin}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setStartHour(h);
                  setStartMin(m);
                }}
                style={selectSt}
              >
                {HOURS.flatMap((h) =>
                  [0, 30].map((m) => (
                    <option key={`${h}:${m}`} value={`${h}:${m}`}>
                      {`${pad2(h)}:${pad2(m)}`}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Duración
              </label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                style={selectSt}
              >
                <option value={30}>30 min</option>
                <option value={50}>50 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1.5 horas</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
              </select>
            </div>
          </div>

          {/* Recurring toggle */}
          <div
            onClick={() => setIsRecurring(!isRecurring)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: isRecurring ? "1.5px solid #10b981" : "1.5px solid #e2e8f0",
              background: isRecurring ? "#f0fdf4" : "#fafafa",
              cursor: "pointer",
              marginBottom: "20px",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "6px",
                border: isRecurring ? "none" : "2px solid #cbd5e1",
                background: isRecurring ? "#10b981" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {isRecurring && (
                <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>
                  ✓
                </span>
              )}
            </div>
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}
              >
                Repetir cada semana
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {isRecurring
                  ? `Todos los ${DAY_FULL[parseInt(dayOfWeek)].toLowerCase()} a las ${pad2(startHour)}:${pad2(startMin)}`
                  : "Solo una vez en la fecha seleccionada"}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #059669, #10b981)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                color: "white",
                boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EventDetailModal ─────────────────────────────────────────────────────────
const DETAIL_CONFIGS: Record<
  EventType,
  { color: string; bg: string; label: string; icon: string }
> = {
  vittare: { color: "#059669", bg: "#f0fdf4", label: "Sesión Vittare", icon: "💬" },
  external: { color: "#2563eb", bg: "#eff6ff", label: "Cita externa", icon: "📌" },
  blocked: {
    color: "#64748b",
    bg: "#f8fafc",
    label: "Horario bloqueado",
    icon: "🚫",
  },
};

function EventDetailModal({
  event,
  onClose,
  onDelete,
  onViewSession,
}: {
  event: CalEvent | null;
  onClose: () => void;
  onDelete: (e: CalEvent) => void;
  onViewSession: (appointmentId: string) => void;
}) {
  if (!event) return null;
  const cfg = DETAIL_CONFIGS[event.type];
  const endMins = event.startHour * 60 + event.startMin + event.durationMin;
  const startLabel = `${pad2(event.startHour)}:${pad2(event.startMin)}`;
  const endLabel = `${pad2(Math.floor(endMins / 60))}:${pad2(endMins % 60)}`;
  const isRecurring = event.raw?.is_recurring;
  const isPending = event.raw?.status === "pending";
  const dateLabel = format(event.date, "EEEE, d 'de' MMMM yyyy", { locale: es });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "16px",
          width: "min(360px, 90vw)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Colored top bar */}
        <div style={{ height: "4px", background: cfg.color }} />

        <div style={{ padding: "20px 24px" }}>
          {/* Title row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: cfg.color,
                  background: cfg.bg,
                  padding: "3px 8px",
                  borderRadius: "5px",
                }}
              >
                {cfg.icon} {cfg.label}
              </span>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginTop: "10px",
                  marginBottom: 0,
                }}
              >
                {event.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "none",
                background: "#f1f5f9",
                cursor: "pointer",
                fontSize: "14px",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>📅</span>
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {dateLabel}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>🕐</span>
              <span style={{ fontSize: "14px", color: "#374151" }}>
                {startLabel} — {endLabel}
                <span style={{ color: "#94a3b8", marginLeft: "6px" }}>
                  ({event.durationMin} min)
                </span>
              </span>
            </div>
            {isRecurring && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>🔄</span>
                <span style={{ fontSize: "14px", color: "#374151" }}>
                  Se repite cada semana
                </span>
              </div>
            )}
            {event.type === "vittare" && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>
                  {isPending ? "⏳" : "✅"}
                </span>
                <span style={{ fontSize: "14px", color: "#374151" }}>
                  {isPending ? "Pendiente de confirmar" : "Confirmada"}
                </span>
              </div>
            )}
            {event.raw?.notes && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>📝</span>
                <span style={{ fontSize: "14px", color: "#374151" }}>
                  {event.raw.notes}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {event.type === "vittare" ? (
            <button
              onClick={() => {
                onViewSession(event.id);
                onClose();
              }}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: cfg.color,
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ver detalle de sesión →
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onDelete(event)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "1.5px solid #fecaca",
                  background: "#fef2f2",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#dc2626",
                }}
              >
                Eliminar
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "none",
                  background: cfg.color,
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TherapistCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<Date[]>(() => getWeekDates(0));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [addModal, setAddModal] = useState<{
    open: boolean;
    dayOfWeek?: number;
    hour?: number;
  }>({ open: false });
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => new Date().getDay());

  const scrollRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  const todayDayIdx = new Date().getDay();

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

      const { data: appts } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, patient_id, status")
        .eq("psychologist_id", psychologistId)
        .gte("start_time", from.toISOString())
        .lte("start_time", to.toISOString())
        .neq("status", "cancelled");

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

  // Scroll to current hour on first load
  useEffect(() => {
    if (!loading && !scrolledRef.current && scrollRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - HOUR_START - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
      if (gutterRef.current) gutterRef.current.scrollTop = scrollTo;
      scrolledRef.current = true;
    }
  }, [loading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

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

  // Stats
  const vittareCount = events.filter((e) => e.type === "vittare").length;
  const externalCount = events.filter((e) => e.type === "external").length;
  const pendingCount = events.filter((e) => e.raw?.status === "pending").length;

  const weekLabel =
    weekDates.length === 7
      ? format(weekDates[1] ?? weekDates[0], "MMMM yyyy", { locale: es })
      : "";

  const visibleDayIndices =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => i)
      : [selectedDayIdx];

  // ── Availability editor ───────────────────────────────────────────────────
  if (showEditor && psychologistId) {
    return (
      <div style={{ padding: "4px" }}>
        <button
          onClick={() => setShowEditor(false)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1.5px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            color: "#64748b",
            marginBottom: "16px",
          }}
        >
          ← Volver al calendario
        </button>
        <AvailabilityEditor
          psychologistId={psychologistId}
          onClose={() => setShowEditor(false)}
        />
      </div>
    );
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 140px)",
        color: "#0f172a",
        background: "#f8fafb",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e8ecf0",
      }}
    >
      {/* ─── Top Bar ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 20px",
          background: "white",
          borderBottom: "1px solid #e8ecf0",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Mi Calendario
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginTop: "2px",
                textTransform: "capitalize",
              }}
            >
              {weekLabel}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Quick stats */}
            {!loading && (vittareCount > 0 || externalCount > 0) && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "5px 12px",
                  background: "#f8fafb",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                }}
              >
                {vittareCount > 0 && (
                  <span
                    style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}
                  >
                    💬 {vittareCount}
                  </span>
                )}
                {externalCount > 0 && (
                  <span
                    style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}
                  >
                    📌 {externalCount}
                  </span>
                )}
                {pendingCount > 0 && (
                  <span
                    style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}
                  >
                    ⏳ {pendingCount}
                  </span>
                )}
              </div>
            )}

            {psychologistId && (
              <button
                onClick={() =>
                  setAddModal({ open: true, dayOfWeek: todayDayIdx, hour: 9 })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
                }}
              >
                <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span>
                Agregar
              </button>
            )}
            <button
              onClick={() => setShowEditor(true)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                color: "#64748b",
              }}
            >
              ⚙ Horario
            </button>
          </div>
        </div>

        {/* Nav + view toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              ←
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                background: weekOffset === 0 ? "#f0fdf4" : "white",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                color: weekOffset === 0 ? "#059669" : "#64748b",
              }}
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              →
            </button>
          </div>

          {/* Semana / Día toggle */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "3px",
            }}
          >
            {(["week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  if (v === "day") setSelectedDayIdx(todayDayIdx);
                }}
                style={{
                  padding: "5px 14px",
                  borderRadius: "6px",
                  border: "none",
                  background: view === v ? "white" : "transparent",
                  boxShadow:
                    view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: view === v ? "#0f172a" : "#94a3b8",
                  transition: "all 0.15s ease",
                }}
              >
                {v === "week" ? "Semana" : "Día"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Grid ──────────────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        {/* Time gutter */}
        <div
          style={{
            width: "52px",
            flexShrink: 0,
            background: "white",
            borderRight: "1px solid #cbd5e1",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Spacer aligns with day header row */}
          <div
            style={{
              height: "52px",
              borderBottom: "1px solid #e8ecf0",
              flexShrink: 0,
            }}
          />
          {/* Synced scroll */}
          <div
            ref={gutterRef}
            style={{ flex: 1, overflow: "hidden" }}
          >
            <div
              style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
            >
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  style={{
                    height: `${HOUR_HEIGHT}px`,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: i === 0 ? "3px" : "-8px",
                      right: "8px",
                      fontSize: "10px",
                      color: "#94a3b8",
                      fontWeight: 500,
                      lineHeight: 1,
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {`${pad2(h)}:00`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day columns area */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {/* Scrollable container — headers are sticky inside so they share the same width */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}
          >
          {/* Day headers — sticky so they stay visible while scrolling */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "grid",
              gridTemplateColumns:
                view === "week" ? "repeat(7, 1fr)" : "1fr",
              borderBottom: "1px solid #e8ecf0",
              background: "white",
              height: "52px",
            }}
          >
            {visibleDayIndices.map((dayIdx) => {
              const date = weekDates[dayIdx];
              if (!date) return null;
              const today = isToday(date);
              const dayEvts = eventsForDay(date);
              const vittareEvts = dayEvts.filter(
                (e) => e.type === "vittare"
              );
              const externalEvts = dayEvts.filter(
                (e) => e.type === "external"
              );

              return (
                <div
                  key={dayIdx}
                  onClick={() => {
                    if (view === "week") {
                      setView("day");
                      setSelectedDayIdx(dayIdx);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    cursor: view === "week" ? "pointer" : "default",
                    borderRight:
                      view === "week" ? "1px solid #dde3ea" : "none",
                    background: today ? "#f0fdf4" : "white",
                    transition: "background 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {DAY_SHORT[dayIdx]}
                  </span>
                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: today ? "white" : "#0f172a",
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: today ? "#059669" : "transparent",
                      marginTop: "1px",
                    }}
                  >
                    {format(date, "d")}
                  </div>
                  {/* Event dots */}
                  {view === "week" &&
                    (vittareEvts.length > 0 || externalEvts.length > 0) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "3px",
                          marginTop: "3px",
                        }}
                      >
                        {vittareEvts.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: "#10b981",
                            }}
                          />
                        ))}
                        {externalEvts.slice(0, 2).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: "#3b82f6",
                            }}
                          />
                        ))}
                        {dayEvts.length > 5 && (
                          <span
                            style={{
                              fontSize: "9px",
                              color: "#94a3b8",
                              fontWeight: 600,
                            }}
                          >
                            +{dayEvts.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          {/* Event grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  view === "week" ? "repeat(7, 1fr)" : "1fr",
                height: `${HOURS.length * HOUR_HEIGHT}px`,
                position: "relative",
              }}
            >
              {visibleDayIndices.map((dayIdx) => {
                const date = weekDates[dayIdx];
                if (!date) return null;
                const today = isToday(date);
                const dayEvts = eventsForDay(date);

                return (
                  <div
                    key={dayIdx}
                    style={{
                      position: "relative",
                      borderRight:
                        view === "week" ? "1px solid #dde3ea" : "none",
                      background: today
                        ? "rgba(16,185,129,0.02)"
                        : "transparent",
                    }}
                  >
                    {/* Hour cells (click to add) */}
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        onClick={() =>
                          setAddModal({
                            open: true,
                            dayOfWeek: dayIdx,
                            hour: h,
                          })
                        }
                        style={{
                          height: `${HOUR_HEIGHT}px`,
                          borderTop: "1px solid #dde3ea",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(16,185,129,0.03)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      />
                    ))}
                    {/* Events */}
                    {dayEvts.map((ev) => (
                      <EventBlock
                        key={ev.id}
                        event={ev}
                        onClick={setSelectedEvent}
                      />
                    ))}
                    {/* Now line */}
                    {today && <NowLine />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Legend ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "8px 20px",
          background: "white",
          borderTop: "1px solid #e8ecf0",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexShrink: 0,
          fontSize: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background: "#10b981",
            }}
          />
          <span style={{ color: "#64748b" }}>Vittare</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background: "#3b82f6",
            }}
          />
          <span style={{ color: "#64748b" }}>Externas</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background:
                "repeating-linear-gradient(135deg, #e2e8f0, #e2e8f0 2px, #f1f5f9 2px, #f1f5f9 4px)",
            }}
          />
          <span style={{ color: "#64748b" }}>Bloqueado</span>
        </div>
        <div style={{ marginLeft: "auto", color: "#94a3b8" }}>
          <span>↻ = recurrente</span>
          <span style={{ marginLeft: "12px" }}>
            Click en celda vacía para agregar
          </span>
        </div>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────── */}
      {psychologistId && (
        <AddBlockModal
          open={addModal.open}
          onClose={() => setAddModal({ open: false })}
          onSaved={fetchEvents}
          psychologistId={psychologistId}
          initialDayOfWeek={addModal.dayOfWeek}
          initialHour={addModal.hour}
        />
      )}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={handleDeleteBlock}
        onViewSession={(appointmentId) =>
          navigate(`/therapist/sessions/${appointmentId}`)
        }
      />
    </div>
  );
}
