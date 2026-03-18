import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Search, Filter, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function TherapistSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefLoading, setBriefLoading] = useState<string | null>(null);
  const [briefData, setBriefData] = useState<{ text: string; sources: Record<string, boolean> } | null>(null);
  const [briefDialogOpen, setBriefDialogOpen] = useState(false);
  const [briefPatientName, setBriefPatientName] = useState("");

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Fetch appointments first
      const { data: appts, error: apptError } = await supabase
        .from("appointments")
        .select("*")
        .eq("psychologist_id", profile.id)
        .order("start_time", { ascending: true });

      if (apptError) throw apptError;

      const patientIds = Array.from(new Set((appts || []).map((a: any) => a.patient_id))).filter(Boolean);

      let profilesById: Record<string, any> = {};
      if (patientIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", patientIds);
        if (profErr) throw profErr;
        profilesById = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
      }

      const enriched = (appts || []).map((a: any) => ({
        ...a,
        profile: profilesById[a.patient_id] || null,
      }));

      setSessions(enriched);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  };

  const canJoinCall = (startTime: string) => {
    const diffMin = (new Date(startTime).getTime() - Date.now()) / (1000 * 60);
    return diffMin <= 15 && diffMin >= -30;
  };

  // TEMPORAL — para pruebas sin esperar sesión
  const handleMarkCompleted = async (session: any) => {
    try {
      // 1. Actualizar status
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", session.id);
      if (error) throw error;

      // 2. Revenue recognition (85/15 split)
      await supabase.rpc("recognize_session_revenue", { _appointment_id: session.id });

      // 3. Notificar al psicólogo por email
      try {
        // Precio por sesión desde deferred_revenue
        const { data: deferredData } = await supabase
          .from("deferred_revenue")
          .select("price_per_session")
          .eq(session.subscription_id ? "subscription_id" : "appointment_id",
             session.subscription_id || session.id)
          .maybeSingle();

        const { data: paymentData } = !deferredData?.price_per_session ? await supabase
          .from("payments")
          .select("base_amount")
          .eq("appointment_id", session.id)
          .maybeSingle() : { data: null };

        const sessionPrice = Number(deferredData?.price_per_session || paymentData?.base_amount || 0);

        if (sessionPrice > 0 && user) {
          const { data: psychProfile } = await supabase
            .from("psychologist_profiles")
            .select("user_id, first_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (psychProfile?.user_id) {
            const psychCut = Math.round(sessionPrice * 0.85 * 100) / 100;
            const { data: { session: authSession } } = await supabase.auth.getSession();
            if (authSession) {
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${authSession.access_token}`,
                  "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  notification_type: "payment_update",
                  recipient_user_id: psychProfile.user_id,
                  variables: {
                    recipient_name: psychProfile.first_name || "Psicólogo",
                    payment_description: "Sesión completada. El pago ha sido acreditado a tu cuenta.",
                    amount: `${psychCut.toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`,
                    concept: `Tu parte (85%) de la sesión con ${session.profile?.full_name || "paciente"}`,
                  },
                }),
              }).catch(() => {});
            }
          }
        }
      } catch {
        // Best-effort
      }

      toast.success("Sesión marcada como completada");
      loadSessions();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar sesión");
    }
  };

  const handleGenerateBrief = async (appointmentId: string, patientName: string) => {
    setBriefLoading(appointmentId);
    setBriefPatientName(patientName);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No autenticado");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-session-brief`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ appointment_id: appointmentId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error generando resumen");

      setBriefData({ text: result.brief, sources: result.sources || {} });
      setBriefDialogOpen(true);
    } catch (error: any) {
      console.error("Brief error:", error);
      toast.error(error.message || "Error al generar el resumen");
    } finally {
      setBriefLoading(null);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const name = session.profile?.full_name?.toLowerCase() || "";
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === "todas") {
      matchesStatus = true;
    } else if (statusFilter === "pendiente") {
      matchesStatus = session.status === "pending" || session.status === "confirmed";
    } else if (statusFilter === "completada") {
      matchesStatus = session.status === "completed";
    } else if (statusFilter === "cancelada") {
      matchesStatus = session.status === "cancelled";
    } else if (statusFilter === "no_show") {
      matchesStatus = session.status === "no_show";
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Sesiones</h1>
          <p className="text-[#6B7280] mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Sesiones</h1>
        <p className="text-[#6B7280] mt-1">
          Gestiona y revisa todas tus sesiones
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-0 border-l-4 border-l-[#12A357] shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <Input
                placeholder="Buscar por paciente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="completada">Completadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
                <SelectItem value="no_show">Sin asistencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de sesiones */}
      <div className="grid gap-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="w-12 h-12 mx-auto text-[#12A357] mb-4" />
              <p className="text-[#6B7280]">
                No se encontraron sesiones con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className={`border-0 border-l-4 shadow-sm hover:shadow-md transition-all ${
              (session.status === "pending" || session.status === "confirmed") ? "border-l-[#D9A932]" :
              session.status === "completed" ? "border-l-[#6AB7AB]" :
              session.status === "cancelled" ? "border-l-red-400" :
              "border-l-[#E5E7EB]"
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-[#1F4D2E]">
                      {session.profile?.full_name || "Paciente"}
                    </CardTitle>
                    <p className="text-[#6B7280] mt-1">
                      {new Date(session.start_time).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • {new Date(session.start_time).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} • 50 min
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      (session.status === "pending" || session.status === "confirmed")
                        ? "bg-[#FEF9EA] text-[#D9A932]"
                        : session.status === "completed"
                        ? "bg-[#EFF6FF] text-[#3B82F6]"
                        : session.status === "cancelled"
                        ? "bg-red-50 text-red-600"
                        : session.status === "no_show"
                        ? "bg-gray-50 text-gray-600"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {(session.status === "pending" || session.status === "confirmed") ? "pendiente" :
                     session.status === "completed" ? "completada" :
                     session.status === "cancelled" ? "cancelada" :
                     session.status === "no_show" ? "sin asistencia" : session.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.session_notes && (
                    <div>
                      <p className="text-sm font-medium text-[#1F4D2E] mb-1">
                        Notas de la sesión:
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {session.session_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(session.status === "pending" || session.status === "confirmed" || session.status === "scheduled") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateBrief(session.id, session.profile?.full_name || "Paciente")}
                        disabled={briefLoading === session.id}
                        className="gap-1.5"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${briefLoading === session.id ? "animate-pulse" : ""}`} />
                        {briefLoading === session.id ? "Preparando..." : "Preparar sesión"}
                      </Button>
                    )}
                    {(session.status === "pending" || session.status === "confirmed") && canJoinCall(session.start_time) && (
                      <Button
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Iniciar videollamada
                      </Button>
                    )}
                    {(session.status === "pending" || session.status === "confirmed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkCompleted(session)}
                      >
                        ⚠️ Marcar completada (temporal)
                      </Button>
                    )}
                    {session.status === "completed" && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/therapist/sessions/${session.id}`)}
                      >
                        Ver transcripción / análisis
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/therapist/patients/${session.patient_id}`)}
                    >
                      Ver detalles del paciente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={briefDialogOpen} onOpenChange={setBriefDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#12A357]" />
              Resumen pre-sesión — {briefPatientName}
            </DialogTitle>
          </DialogHeader>
          {briefData && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {briefData.text}
                </div>
              </div>

              {/* Sources used */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <span className="text-xs text-[#6B7280]">Fuentes:</span>
                {briefData.sources.ai_summaries && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Resúmenes IA
                  </span>
                )}
                {briefData.sources.clinical_notes && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Tus notas
                  </span>
                )}
                {briefData.sources.tasks && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Tareas
                  </span>
                )}
                {briefData.sources.preferences && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                    Perfil del paciente
                  </span>
                )}
                {briefData.sources.first_session && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-700 border border-gray-200">
                    Primera sesión
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[#6B7280]">
                Este resumen es generado por IA como apoyo. No sustituye tu criterio clínico.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
