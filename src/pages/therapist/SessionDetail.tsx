import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, AlignLeft, Clock, Hash, RefreshCw, Save, Pencil, Upload, Image, Loader2, Camera, Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

// ─── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-[#6B7280]">
      <p>{message}</p>
    </div>
  );
}

// ─── VTT parsing ──────────────────────────────────────────────────────────────
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
  const speakers = Array.from(new Set(blocks.map((b) => b.speaker)));
  const speakerColors: Record<string, string> = {};
  const palette = [
    "bg-blue-50 border-blue-200 text-blue-900",
    "bg-emerald-50 border-emerald-200 text-emerald-900",
    "bg-violet-50 border-violet-200 text-violet-900",
    "bg-amber-50 border-amber-200 text-amber-900",
  ];
  speakers.forEach((s, i) => { speakerColors[s] = palette[i % palette.length]; });

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
          <p className="text-sm leading-relaxed">{block.lines.join(" ")}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
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
  const [clinicalNotes, setClinicalNotes] = useState<{ id: string; note_text: string; image_url: string | null } | null>(null);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [noteMode, setNoteMode] = useState<"text" | "photo">("text");

  useEffect(() => {
    if (user && sessionId) fetchData();
  }, [user, sessionId]);

  const fetchData = async () => {
    if (!user || !sessionId) return;
    setLoading(true);
    try {
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

      const { data: tx } = await (supabase as any)
        .from("session_transcripts")
        .select("*")
        .eq("appointment_id", sessionId)
        .maybeSingle();

      setTranscript(tx ?? null);

      // Load clinical notes
      const { data: notes } = await (supabase as any)
        .from("session_clinical_notes")
        .select("id, note_text, image_url")
        .eq("appointment_id", sessionId)
        .eq("therapist_id", user.id)
        .maybeSingle();
      if (notes) {
        setClinicalNotes(notes);
        setNotesText(notes.note_text ?? "");
      }
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ appointment_id: sessionId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("fetch-session-transcript error:", res.status, text);
        toast.error(`Error al obtener transcripción (${res.status})`);
        return;
      }
      await res.json().catch(() => null);
      await fetchData();
    } catch (err) {
      console.error("Error fetching transcript:", err);
      toast.error("Error al obtener la transcripción");
    } finally {
      setFetchingTranscript(false);
    }
  };

  const handleAnalyzeTranscript = async (force = false) => {
    if (!sessionId) return;
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ appointment_id: sessionId, force }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("analyze-transcript error:", res.status, text);
        toast.error(`Error al analizar transcripción (${res.status})`);
        return;
      }
      await res.json().catch(() => null);
      await fetchData();
      toast.success("Análisis completado");
    } catch (err) {
      console.error("Error analyzing transcript:", err);
      toast.error("Error al analizar la transcripción");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !sessionId) return;
    setSavingNotes(true);
    try {
      if (clinicalNotes?.id) {
        await (supabase as any)
          .from("session_clinical_notes")
          .update({ note_text: notesText })
          .eq("id", clinicalNotes.id);
        setClinicalNotes({ ...clinicalNotes, note_text: notesText });
      } else {
        const { data } = await (supabase as any)
          .from("session_clinical_notes")
          .insert({ appointment_id: sessionId, therapist_id: user.id, note_text: notesText })
          .select("id, note_text, image_url")
          .single();
        if (data) setClinicalNotes(data);
      }
      setNotesEditing(false);
      toast.success("Nota guardada");
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Error al guardar la nota");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user || !sessionId) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${sessionId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("clinical-notes")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("clinical-notes").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      if (clinicalNotes?.id) {
        await (supabase as any)
          .from("session_clinical_notes")
          .update({ image_url: imageUrl })
          .eq("id", clinicalNotes.id);
        setClinicalNotes({ ...clinicalNotes, image_url: imageUrl });
      } else {
        const { data } = await (supabase as any)
          .from("session_clinical_notes")
          .insert({ appointment_id: sessionId, therapist_id: user.id, note_text: notesText, image_url: imageUrl })
          .select("id, note_text, image_url")
          .single();
        if (data) setClinicalNotes(data);
      }
      toast.success("Imagen guardada");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTranscribe = async () => {
    if (!clinicalNotes?.image_url || !sessionId) return;
    setTranscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ appointment_id: sessionId, image_url: clinicalNotes.image_url }),
      });
      if (!res.ok) {
        toast.error("Error al transcribir la imagen");
        return;
      }
      const result = await res.json();
      if (result.text) {
        const merged = notesText ? `${notesText}\n\n${result.text}` : result.text;
        setNotesText(merged);
        setNoteMode("text");
        toast.success("Transcripción lista");
      }
    } catch (err) {
      console.error("Error transcribing:", err);
      toast.error("Error al transcribir");
    } finally {
      setTranscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B7280]">Cargando sesión...</p>
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
          <h1 className="text-2xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {appointment?.patient_name ?? "Paciente"}
          </h1>
          <p className="text-sm text-[#6B7280]">{dateLabel}</p>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        {/* Fetch transcript when not yet available */}
        {(!transcript || transcript.status !== "completed") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchTranscript}
            disabled={fetchingTranscript}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingTranscript ? "animate-spin" : ""}`} />
            {fetchingTranscript ? "Buscando transcripción..." : "Obtener transcripción"}
          </Button>
        )}

        {/* Analyze — only once, when transcript ready but no AI analysis yet */}
        {transcript?.status === "completed" && transcript.transcript_raw && !transcript.ai_summary && (
          <Button
            size="sm"
            onClick={() => handleAnalyzeTranscript(false)}
            disabled={analyzing}
            className="gap-2"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? "animate-pulse" : ""}`} />
            {analyzing ? "Analizando..." : "Analizar transcripción"}
          </Button>
        )}
      </div>

      {/* Meta info strip */}
      {transcript && (
        <div className="flex flex-wrap gap-4 text-sm text-[#6B7280]">
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
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mis Notas</span>
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
                <TranscriptView raw={transcript.transcript_raw} />
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
                        <span key={i} className="px-3 py-1 bg-[#E8F5EE] text-[#12A357] rounded-full text-sm">{t}</span>
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
                  <CardHeader><CardTitle className="text-base">Puntos principales</CardTitle></CardHeader>
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

        {/* RESUMEN (texto libre) */}
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

        {/* MIS NOTAS */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Mis Notas</CardTitle>
                <div className="flex items-center gap-2">
                  {!notesEditing ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNotesEditing(true)}>
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                  ) : (
                    <Button size="sm" className="gap-1.5" onClick={handleSaveNotes} disabled={savingNotes}>
                      {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Guardar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {notesEditing ? (
                <>
                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <Button
                      variant={noteMode === "text" ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setNoteMode("text")}
                    >
                      <Type className="w-3.5 h-3.5" />
                      Texto
                    </Button>
                    <Button
                      variant={noteMode === "photo" ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setNoteMode("photo")}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Foto
                    </Button>
                  </div>

                  {noteMode === "text" && (
                    <Textarea
                      placeholder="Escribe tus notas clínicas aquí..."
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="min-h-48 resize-none"
                    />
                  )}

                  {noteMode === "photo" && (
                    <div className="space-y-3">
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#12A357]/50 transition-colors">
                        {uploadingImage ? (
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-[#6B7280] mb-2" />
                            <span className="text-sm text-[#6B7280]">Subir foto de nota</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                      </label>

                      {clinicalNotes?.image_url && (
                        <div className="space-y-2">
                          <img
                            src={clinicalNotes.image_url}
                            alt="Nota clínica"
                            className="rounded-lg max-h-64 object-contain border border-border"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleTranscribe}
                            disabled={transcribing}
                          >
                            {transcribing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {transcribing ? "Transcribiendo..." : "Transcribir con IA"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!clinicalNotes?.note_text && !clinicalNotes?.image_url ? (
                    <EmptyState message="No hay notas para esta sesión. Haz clic en Editar para agregar." />
                  ) : (
                    <div className="space-y-4">
                      {clinicalNotes?.note_text && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{clinicalNotes.note_text}</p>
                      )}
                      {clinicalNotes?.image_url && (
                        <img
                          src={clinicalNotes.image_url}
                          alt="Nota clínica"
                          className="rounded-lg max-h-64 object-contain border border-border"
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
