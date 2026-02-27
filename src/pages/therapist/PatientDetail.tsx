import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Calendar, FileText, Search,
  MessageSquareText, Eye, Loader2, Video,
  ChevronDown, ChevronUp, PenLine, Timer, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAGE_SIZE = 10;

interface PatientInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
}

interface SessionItem {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  session_notes: string | null;
  daily_recording_id: string | null;
  clinical_notes: {
    id: string;
    subjective_notes: string | null;
    objective_notes: string | null;
    assessment: string | null;
    plan: string | null;
    private_notes: string | null;
  } | null;
  transcript: {
    id: string;
    status: string;
    duration_minutes: number | null;
    word_count: number | null;
  } | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: "Completada", className: "bg-green-50 text-green-700 border-green-200" },
    pending:   { label: "Pendiente",  className: "bg-amber-50 text-amber-700 border-amber-200" },
    confirmed: { label: "Pendiente",  className: "bg-amber-50 text-amber-700 border-amber-200" },
    cancelled: { label: "Cancelada",  className: "bg-red-50 text-red-700 border-red-200" },
    no_show:   { label: "Sin asistencia", className: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  const v = map[status] ?? { label: status, className: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${v.className}`}>
      {v.label}
    </span>
  );
}

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [allSessions, setAllSessions] = useState<SessionItem[]>([]);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // Inline SOAP panel
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [soapData, setSoapData] = useState({
    subjective: "", objective: "", assessment: "", plan: "", privateNotes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && patientId) fetchData();
  }, [user, patientId]);

  const fetchData = async () => {
    if (!user || !patientId) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;
      setPsychologistId(profile.id);

      const { data: patientData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .eq("id", patientId)
        .single();
      if (patientData) setPatient(patientData as PatientInfo);

      const { data: sessionsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("psychologist_id", profile.id)
        .eq("patient_id", patientId)
        .order("start_time", { ascending: false });

      if (sessionsData) {
        const enriched = await Promise.all(
          sessionsData.map(async (s) => {
            const { data: notes } = await supabase
              .from("session_clinical_notes")
              .select("*")
              .eq("appointment_id", s.id)
              .maybeSingle();

            const { data: transcript } = await (supabase as any)
              .from("session_transcripts")
              .select("id, status, duration_minutes, word_count")
              .eq("appointment_id", s.id)
              .maybeSingle();

            return { ...s, clinical_notes: notes ?? null, transcript: transcript ?? null } as SessionItem;
          })
        );
        setAllSessions(enriched);
      }
    } catch (err) {
      console.error("Error fetching patient data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = allSessions.length;
    const completed = allSessions.filter(s => s.status === "completed").length;
    const withTranscripts = allSessions.filter(s => s.transcript?.status === "completed").length;
    const durations = allSessions
      .filter(s => s.transcript?.duration_minutes)
      .map(s => s.transcript!.duration_minutes!);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    return { total, completed, withTranscripts, avgDuration };
  }, [allSessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return allSessions.filter(s => {
      if (searchText && !s.session_notes?.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (statusFilter === "completed" && s.status !== "completed") return false;
      if (statusFilter === "pending" && s.status !== "pending" && s.status !== "confirmed") return false;
      if (statusFilter === "cancelled" && s.status !== "cancelled") return false;
      if (statusFilter === "no_show" && s.status !== "no_show") return false;
      if (dateFrom && new Date(s.start_time) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.start_time) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [allSessions, searchText, statusFilter, dateFrom, dateTo]);

  const visibleSessions = filteredSessions.slice(0, pageSize);

  const handleToggleSOAP = (session: SessionItem) => {
    if (expandedSessionId === session.id) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(session.id);
    const n = session.clinical_notes;
    setSoapData({
      subjective: n?.subjective_notes ?? "",
      objective: n?.objective_notes ?? "",
      assessment: n?.assessment ?? "",
      plan: n?.plan ?? "",
      privateNotes: n?.private_notes ?? "",
    });
  };

  const handleSaveSOAP = async (session: SessionItem) => {
    if (!psychologistId || !patientId) return;
    setSaving(true);
    try {
      const noteData = {
        appointment_id: session.id,
        psychologist_id: psychologistId,
        patient_id: patientId,
        session_date: session.start_time,
        subjective_notes: soapData.subjective,
        objective_notes: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
        private_notes: soapData.privateNotes,
      };

      if (session.clinical_notes?.id) {
        const { error } = await supabase
          .from("session_clinical_notes")
          .update(noteData)
          .eq("id", session.clinical_notes.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("session_clinical_notes")
          .insert(noteData);
        if (error) throw error;
      }

      toast.success("Notas guardadas exitosamente");
      setExpandedSessionId(null);
      await fetchData();
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Error al guardar las notas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando expediente...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se encontró el paciente</p>
      </div>
    );
  }

  const initials = patient.full_name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/therapist/patients")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Avatar className="w-14 h-14">
          <AvatarImage src={patient.avatar_url ?? ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{patient.full_name}</h1>
          {patient.email && (
            <p className="text-sm text-muted-foreground">{patient.email}</p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Sesiones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Complet.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Timer className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgDuration > 0 ? `${stats.avgDuration}m` : "--"}</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <MessageSquareText className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withTranscripts}</p>
                <p className="text-xs text-muted-foreground">Transcr.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historial de Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en notas..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPageSize(PAGE_SIZE); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="no_show">Sin asistencia</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPageSize(PAGE_SIZE); }}
              className="w-full sm:w-40"
              placeholder="Desde"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPageSize(PAGE_SIZE); }}
              className="w-full sm:w-40"
              placeholder="Hasta"
            />
          </div>

          {/* Sessions */}
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No se encontraron sesiones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSessions.map(session => {
                const start = new Date(session.start_time);
                const end = new Date(session.end_time);
                const dateLabel = format(start, "d 'de' MMMM, yyyy", { locale: es });
                const timeLabel = `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
                const hasTranscript = session.transcript?.status === "completed";
                const isProcessing = session.transcript?.status === "transcribing" || session.transcript?.status === "pending";
                const isExpanded = expandedSessionId === session.id;

                return (
                  <div key={session.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="p-4">
                      {/* Date + time */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-medium text-foreground">
                            📅 {dateLabel} • {timeLabel}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <StatusBadge status={session.status} />
                        {hasTranscript && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                            💬 Transcripción
                          </span>
                        )}
                        {isProcessing && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 inline-flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Procesando
                          </span>
                        )}
                        {session.clinical_notes && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                            📝 Notas SOAP
                          </span>
                        )}
                        {session.daily_recording_id && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200">
                            🎥 Grabación
                          </span>
                        )}
                      </div>

                      {/* Notes preview */}
                      {session.session_notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {session.session_notes}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {(hasTranscript || session.status === "completed") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/therapist/sessions/${session.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Ver transcripción y detalle
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSOAP(session)}
                          className="gap-1.5"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          Editar notas SOAP
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Inline SOAP panel */}
                    {isExpanded && (
                      <div className="border-t border-border bg-accent/30 p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Subjetivo (S)
                            </Label>
                            <Textarea
                              placeholder="¿Qué reporta el paciente?"
                              value={soapData.subjective}
                              onChange={e => setSoapData(p => ({ ...p, subjective: e.target.value }))}
                              className="mt-1 min-h-[90px] text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Objetivo (O)
                            </Label>
                            <Textarea
                              placeholder="Observaciones del terapeuta..."
                              value={soapData.objective}
                              onChange={e => setSoapData(p => ({ ...p, objective: e.target.value }))}
                              className="mt-1 min-h-[90px] text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Evaluación (A)
                            </Label>
                            <Textarea
                              placeholder="Análisis clínico, diagnóstico..."
                              value={soapData.assessment}
                              onChange={e => setSoapData(p => ({ ...p, assessment: e.target.value }))}
                              className="mt-1 min-h-[90px] text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Plan (P)
                            </Label>
                            <Textarea
                              placeholder="Próximos pasos, objetivos..."
                              value={soapData.plan}
                              onChange={e => setSoapData(p => ({ ...p, plan: e.target.value }))}
                              className="mt-1 min-h-[90px] text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Notas Privadas
                          </Label>
                          <Textarea
                            placeholder="Notas personales (solo visibles para ti)..."
                            value={soapData.privateNotes}
                            onChange={e => setSoapData(p => ({ ...p, privateNotes: e.target.value }))}
                            className="mt-1 min-h-[70px] text-sm"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setExpandedSessionId(null)}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSaveSOAP(session)}
                            disabled={saving}
                          >
                            {saving ? "Guardando..." : "Guardar notas"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {filteredSessions.length > 0 && (
                <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                  <span>Mostrando {Math.min(pageSize, filteredSessions.length)} de {filteredSessions.length} sesiones</span>
                  {pageSize < filteredSessions.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageSize(p => p + PAGE_SIZE)}
                    >
                      Cargar más
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
