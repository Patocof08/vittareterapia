import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, AlignLeft, Brain, Clock, Hash, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface TranscriptData {
  id: string;
  status: string;
  transcript_raw: string | null;
  duration_minutes: number | null;
  word_count: number | null;
  ai_summary: string | null;
  ai_clinical_notes: any;
  ai_key_topics: string[] | null;
  ai_risk_indicators: string[] | null;
  ai_patient_tasks: string[] | null;
  ai_followup_suggestions: string[] | null;
  ai_progress_notes: string | null;
}

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string;
  patient_id: string;
  patient_name: string | null;
}

const TAB_VALUES = ["complete", "highlights", "summary", "notes"] as const;

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}

interface TranscriptBlock {
  speaker: string;
  time: string;
  lines: string[];
}

function formatVttTime(time: string): string {
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const h = parseInt(parts[0]);
  const m = parts[1];
  const s = parts[2]?.split(".")[0] ?? "00";
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function parseTranscript(vtt: string): TranscriptBlock[] {
  if (!vtt) return [];
  const cues: { time: string; speaker: string; text: string }[] = [];
  // Normalize line endings (\r\n → \n)
  const normalized = vtt.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;

    const startTime = lines[timeIdx].split("-->")[0].trim();
    const formatted = formatVttTime(startTime);
    const textRaw = lines.slice(timeIdx + 1).join(" ").trim();
    if (!textRaw) continue;

    // Match <v>SPEAKER:</v>TEXT  or  <v SPEAKER>TEXT
    const m =
      textRaw.match(/^<v>([^<]*)<\/v>(.*)$/) ||
      textRaw.match(/^<v\s+([^>]+)>(.*)$/);

    if (m) {
      const speaker = m[1].replace(/:$/, "").trim();
      const text = m[2].replace(/<\/v>/g, "").trim();
      if (text) cues.push({ time: formatted, speaker, text });
    } else if (!textRaw.startsWith("<")) {
      cues.push({ time: formatted, speaker: "", text: textRaw });
    }
  }

  // Merge consecutive cues from the same speaker
  const merged: TranscriptBlock[] = [];
  for (const cue of cues) {
    const last = merged[merged.length - 1];
    if (last && last.speaker === cue.speaker) {
      last.lines.push(cue.text);
    } else {
      merged.push({ speaker: cue.speaker, time: cue.time, lines: [cue.text] });
    }
  }
  return merged;
}

function TranscriptView({ raw }: { raw: string }) {
  const blocks = parseTranscript(raw);
  if (blocks.length === 0) {
    return <EmptyState message="Transcripción no disponible para esta sesión." />;
  }

  // Assign a consistent color per speaker name
  const speakers = Array.from(new Set(blocks.map((b) => b.speaker)));
  const speakerColors: Record<string, string> = {};
  const palette = [
    "bg-blue-50 border-blue-200 text-blue-900",
    "bg-emerald-50 border-emerald-200 text-emerald-900",
    "bg-violet-50 border-violet-200 text-violet-900",
    "bg-amber-50 border-amber-200 text-amber-900",
  ];
  speakers.forEach((s, i) => {
    speakerColors[s] = palette[i % palette.length];
  });

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className={`rounded-lg border px-4 py-3 ${speakerColors[block.speaker] ?? "bg-muted border-border"}`}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {block.speaker || "Participante"}
            </span>
            <span className="text-xs opacity-50">{block.time}</span>
          </div>
          <p className="text-sm leading-relaxed">
            {block.lines.join(" ")}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = TAB_VALUES.includes(searchParams.get("tab") as any)
    ? (searchParams.get("tab") as string)
    : "complete";

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [backPath, setBackPath] = useState<string>("/therapist/patients");

  useEffect(() => {
    if (user && sessionId) fetchData();
  }, [user, sessionId]);

  const fetchData = async () => {
    if (!user || !sessionId) return;
    setLoading(true);
    try {
      // Get appointment + patient name
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, patient_id")
        .eq("id", sessionId)
        .single();

      if (appt) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", appt.patient_id)
          .single();

        setAppointment({ ...appt, patient_name: profile?.full_name ?? null });
        setBackPath(`/therapist/patients/${appt.patient_id}`);
      }

      // Get transcript
      const { data: tx } = await (supabase as any)
        .from("session_transcripts")
        .select("*")
        .eq("appointment_id", sessionId)
        .maybeSingle();

      setTranscript(tx ?? null);
    } catch (err) {
      console.error("Error fetching session detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTranscript = async () => {
    if (!sessionId) return;
    setFetchingTranscript(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-session-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ appointment_id: sessionId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('fetch-session-transcript error:', res.status, text);
        toast.error(`Error al obtener transcripción (${res.status})`);
        return;
      }
      await res.json().catch(() => null);
      await fetchData();
    } catch (err) {
      console.error('Error fetching transcript:', err);
      toast.error('Error al obtener la transcripción');
    } finally {
      setFetchingTranscript(false);
    }
  };

  const triggerAiAnalysis = async (force = false) => {
    if (!sessionId) return;
    setAnalyzing(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transcript`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ appointment_id: sessionId, force }),
        }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('analyze-transcript error:', response.status, text);
        toast.error(`Error del servidor (${response.status})`);
        return;
      }

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // response was ok but body is empty or non-JSON — treat as success
        toast.success('Análisis completado');
        await fetchData();
        setActiveTab('notes');
        return;
      }

      if (data.error) {
        toast.error(data.error);
      } else if (data.status === 'already_analyzed' && !force) {
        toast.info('Esta transcripción ya fue analizada');
      } else {
        toast.success('Análisis completado');
        await fetchData();
        setActiveTab('notes');
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
      toast.error('Error al analizar la transcripción');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando sesión...</p>
      </div>
    );
  }

  const dateLabel = appointment
    ? format(new Date(appointment.start_time), "d 'de' MMMM, yyyy • HH:mm", { locale: es })
    : "";

  const hasAiNotes = !!(transcript?.ai_clinical_notes || transcript?.ai_progress_notes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {appointment?.patient_name ?? "Paciente"}
          </h1>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
      </div>

      {/* Fetch transcript button when not yet available */}
      {(!transcript || transcript.status !== 'completed') && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchTranscript}
          disabled={fetchingTranscript}
          className="gap-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${fetchingTranscript ? 'animate-spin' : ''}`} />
          {fetchingTranscript ? 'Buscando transcripción...' : 'Obtener transcripción'}
        </Button>
      )}

      {/* Meta info strip */}
      {transcript && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {transcript.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {transcript.duration_minutes} min
            </span>
          )}
          {transcript.word_count && (
            <span className="flex items-center gap-1">
              <Hash className="w-4 h-4" />
              {transcript.word_count.toLocaleString()} palabras
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="complete" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Completo</span>
          </TabsTrigger>
          <TabsTrigger value="highlights" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlights</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1.5">
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notas IA</span>
          </TabsTrigger>
        </TabsList>

        {/* COMPLETO — raw transcript */}
        <TabsContent value="complete">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transcripción completa</CardTitle>
            </CardHeader>
            <CardContent>
              {!transcript?.transcript_raw ? (
                <EmptyState message="Transcripción no disponible para esta sesión." />
              ) : (
                <>
                  <TranscriptView raw={transcript.transcript_raw} />

                  {/* Botón para generar notas IA */}
                  {transcript.status === "completed" && !transcript.ai_summary && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Sparkles className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            Generar notas clínicas con IA
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Claude analizará la transcripción y generará resumen, notas SOAP, temas clave y más.
                          </p>
                        </div>
                        <Button
                          onClick={() => triggerAiAnalysis()}
                          disabled={analyzing}
                          className="bg-emerald-600 hover:bg-emerald-700"
                          size="sm"
                        >
                          {analyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analizando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Analizar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HIGHLIGHTS */}
        <TabsContent value="highlights" className="space-y-4">
          {(!transcript?.ai_key_topics?.length && !transcript?.ai_risk_indicators?.length && !transcript?.ai_patient_tasks?.length && !transcript?.ai_followup_suggestions?.length) ? (
            <Card><CardContent className="py-8"><EmptyState message="Highlights no disponibles aún." /></CardContent></Card>
          ) : (
            <>
              {!!transcript?.ai_key_topics?.length && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Temas principales</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {transcript.ai_key_topics.map((t, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {!!transcript?.ai_risk_indicators?.length && (
                <Card>
                  <CardHeader><CardTitle className="text-base text-destructive">Indicadores de riesgo</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {transcript.ai_risk_indicators.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {!!transcript?.ai_patient_tasks?.length && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Tareas del paciente</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {transcript.ai_patient_tasks.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {!!transcript?.ai_followup_suggestions?.length && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Sugerencias de seguimiento</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {transcript.ai_followup_suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* RESUMEN */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de la sesión</CardTitle>
            </CardHeader>
            <CardContent>
              {!transcript?.ai_summary ? (
                <EmptyState message="Resumen no disponible aún." />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript.ai_summary}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTAS IA */}
        <TabsContent value="notes" className="space-y-4">
          {hasAiNotes ? (
            <>
              {transcript?.ai_progress_notes && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Notas de progreso</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcript.ai_progress_notes}</p>
                  </CardContent>
                </Card>
              )}
              {transcript?.ai_clinical_notes && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Notas clínicas IA</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="text-sm leading-relaxed font-sans whitespace-pre-wrap">
                      {typeof transcript.ai_clinical_notes === "string"
                        ? transcript.ai_clinical_notes
                        : JSON.stringify(transcript.ai_clinical_notes, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Re-analyze button */}
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => triggerAiAnalysis(true)}
                  disabled={analyzing}
                  className="text-xs text-muted-foreground"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Re-analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Re-analizar con IA
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : analyzing ? (
            <div className="flex flex-col items-center justify-center py-16 text-emerald-600">
              <Loader2 className="w-10 h-10 mb-3 animate-spin" />
              <p className="font-medium">Analizando transcripción...</p>
              <p className="text-sm mt-2 text-center max-w-sm text-muted-foreground">
                Claude está generando las notas clínicas. Esto puede tardar 15-30 segundos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Brain className="w-10 h-10 mb-3 opacity-40" />
              {transcript?.status === "completed" ? (
                <>
                  <p className="font-medium">Notas de IA disponibles</p>
                  <p className="text-sm mt-2 text-center max-w-sm">
                    La transcripción está lista. Haz clic para generar las notas clínicas automáticas.
                  </p>
                  <Button
                    onClick={() => triggerAiAnalysis()}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar notas IA
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-medium">Notas de IA — Próximamente</p>
                  <p className="text-sm mt-2 text-center max-w-sm">
                    Las notas se generarán automáticamente cuando la transcripción esté completa.
                  </p>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
