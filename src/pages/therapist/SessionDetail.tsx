import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, AlignLeft, Brain, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
      <Tabs defaultValue={initialTab}>
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
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                  {transcript.transcript_raw}
                </pre>
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

        {/* NOTAS RESUMIDAS */}
        <TabsContent value="notes" className="space-y-4">
          {(!transcript?.ai_clinical_notes && !transcript?.ai_progress_notes) ? (
            <Card><CardContent className="py-8"><EmptyState message="Notas resumidas no disponibles aún." /></CardContent></Card>
          ) : (
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
