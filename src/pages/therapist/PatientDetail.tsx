import { ArrowLeft, Calendar, FileText, Upload, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface PatientInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Session {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  session_notes: string | null;
  clinical_notes?: {
    id: string;
    subjective_notes: string | null;
    objective_notes: string | null;
    assessment: string | null;
    plan: string | null;
    private_notes: string | null;
    attachments: any;
  } | null;
}

export default function PatientDetail() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);

  // Form states for clinical notes
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !patientId) return;

      try {
        // Get psychologist profile
        const { data: profile } = await supabase
          .from("psychologist_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) return;
        setPsychologistId(profile.id);

        // Get patient info (only non-sensitive data)
        const { data: patientData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", patientId)
          .single();

        if (patientData) {
          setPatient(patientData);
        }

        // Get sessions with clinical notes (only completed sessions)
        const { data: sessionsData } = await supabase
          .from("appointments")
          .select("*")
          .eq("psychologist_id", profile.id)
          .eq("patient_id", patientId)
          .eq("status", "completed")
          .order("start_time", { ascending: false });

        if (sessionsData) {
          // Fetch clinical notes for each session
          const sessionsWithNotes = await Promise.all(
            sessionsData.map(async (session) => {
              const { data: notes } = await supabase
                .from("session_clinical_notes")
                .select("*")
                .eq("appointment_id", session.id)
                .maybeSingle();

              return {
                ...session,
                clinical_notes: notes,
              };
            })
          );

          setSessions(sessionsWithNotes);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, patientId]);

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    if (session.clinical_notes) {
      setSubjective(session.clinical_notes.subjective_notes || "");
      setObjective(session.clinical_notes.objective_notes || "");
      setAssessment(session.clinical_notes.assessment || "");
      setPlan(session.clinical_notes.plan || "");
      setPrivateNotes(session.clinical_notes.private_notes || "");
    } else {
      setSubjective("");
      setObjective("");
      setAssessment("");
      setPlan("");
      setPrivateNotes("");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedSession || !psychologistId || !patientId) return;

    setSaving(true);
    try {
      const noteData = {
        appointment_id: selectedSession.id,
        psychologist_id: psychologistId,
        patient_id: patientId,
        session_date: selectedSession.start_time,
        subjective_notes: subjective,
        objective_notes: objective,
        assessment: assessment,
        plan: plan,
        private_notes: privateNotes,
      };

      if (selectedSession.clinical_notes?.id) {
        // Update existing notes
        const { error } = await supabase
          .from("session_clinical_notes")
          .update(noteData)
          .eq("id", selectedSession.clinical_notes.id);

        if (error) throw error;
      } else {
        // Insert new notes
        const { error } = await supabase
          .from("session_clinical_notes")
          .insert(noteData);

        if (error) throw error;
      }

      toast.success("Notas guardadas exitosamente");

      // Refresh sessions (only completed sessions)
      const { data: sessionsData } = await supabase
        .from("appointments")
        .select("*")
        .eq("psychologist_id", psychologistId)
        .eq("patient_id", patientId)
        .eq("status", "completed")
        .order("start_time", { ascending: false });

      if (sessionsData) {
        const sessionsWithNotes = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: notes } = await supabase
              .from("session_clinical_notes")
              .select("*")
              .eq("appointment_id", session.id)
              .maybeSingle();

            return {
              ...session,
              clinical_notes: notes,
            };
          })
        );

        setSessions(sessionsWithNotes);
        const updatedSession = sessionsWithNotes.find((s) => s.id === selectedSession.id);
        if (updatedSession) {
          setSelectedSession(updatedSession);
        }
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Error al guardar las notas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando información del paciente...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/therapist/patients")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <Avatar className="w-16 h-16">
            <AvatarImage src={patient.avatar_url || ""} />
            <AvatarFallback>
              {patient.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{patient.full_name}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Historial de Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No hay sesiones registradas
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionSelect(session)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? "bg-accent border-primary"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(session.start_time), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(session.start_time), "HH:mm", { locale: es })} - {format(new Date(session.end_time), "HH:mm", { locale: es })}
                        </p>
                      </div>
                      {session.clinical_notes && (
                        <FileText className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinical Notes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Expediente Clínico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSession ? (
              <p className="text-muted-foreground text-center py-12">
                Selecciona una sesión para ver o agregar notas clínicas
              </p>
            ) : (
              <Tabs defaultValue="soap" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="soap">Notas SOAP</TabsTrigger>
                  <TabsTrigger value="files">Archivos</TabsTrigger>
                </TabsList>

                <TabsContent value="soap" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subjective">Subjetivo (S)</Label>
                      <Textarea
                        id="subjective"
                        placeholder="¿Qué reporta el paciente? Síntomas, preocupaciones, sentimientos..."
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="objective">Objetivo (O)</Label>
                      <Textarea
                        id="objective"
                        placeholder="Observaciones del terapeuta: comportamiento, apariencia, lenguaje corporal..."
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="assessment">Evaluación (A)</Label>
                      <Textarea
                        id="assessment"
                        placeholder="Análisis clínico, diagnóstico, progreso del tratamiento..."
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="plan">Plan (P)</Label>
                      <Textarea
                        id="plan"
                        placeholder="Próximos pasos, tareas, objetivos terapéuticos..."
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="private">Notas Privadas</Label>
                      <Textarea
                        id="private"
                        placeholder="Notas personales, recordatorios (solo visibles para ti)..."
                        value={privateNotes}
                        onChange={(e) => setPrivateNotes(e.target.value)}
                        className="mt-2 min-h-[80px]"
                      />
                    </div>

                    <Button onClick={handleSaveNotes} disabled={saving} className="w-full">
                      {saving ? "Guardando..." : "Guardar Notas"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Arrastra archivos aquí o haz clic para subir
                    </p>
                    <Button variant="outline" size="sm">
                      Seleccionar Archivos
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Archivos adjuntos</p>
                    {selectedSession.clinical_notes?.attachments?.length ? (
                      selectedSession.clinical_notes.attachments.map((file: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay archivos adjuntos
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}