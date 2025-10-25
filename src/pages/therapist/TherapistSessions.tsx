import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Search, Filter, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleStartSession = (sessionId: string, videoLink?: string) => {
    if (videoLink) {
      toast.success("Abriendo videollamada...");
      window.open(videoLink, "_blank");
    } else {
      toast.error("No hay enlace de videollamada disponible");
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      // Get appointment details first
      const { data: appointment } = await supabase
        .from("appointments")
        .select("psychologist_id, patient_id")
        .eq("id", sessionId)
        .single();

      if (!appointment) throw new Error("Cita no encontrada");

      // Get payment to check if it's linked to a subscription
      const { data: payment } = await supabase
        .from("payments")
        .select("subscription_id")
        .eq("appointment_id", sessionId)
        .maybeSingle();

      // Update appointment status
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", sessionId);

      if (error) throw error;

      // If this appointment is part of a package subscription, recognize revenue
      if (payment?.subscription_id) {
        const { error: rpcError } = await supabase.rpc('recognize_session_revenue', {
          _appointment_id: sessionId,
          _subscription_id: payment.subscription_id,
          _psychologist_id: appointment.psychologist_id,
        });

        if (rpcError) {
          console.error("Error recognizing revenue:", rpcError);
          toast.error("Sesión completada, pero hubo un error en el procesamiento de pago");
        } else {
          toast.success("Sesión completada y pago procesado");
        }
      } else {
        const { error: singleRpcError } = await (supabase.rpc as any)('recognize_single_session_revenue', {
          _appointment_id: sessionId,
          _psychologist_id: appointment.psychologist_id,
        });

        if (singleRpcError) {
          console.error("Error recognizing single session revenue:", singleRpcError);
          toast.error("Sesión completada, pero hubo un error en el procesamiento de pago");
        } else {
          toast.success("Sesión completada y pago procesado");
        }
      }

      loadSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Error al completar sesión");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const name = session.profile?.full_name?.toLowerCase() || "";
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === "todas") {
      matchesStatus = true;
    } else if (statusFilter === "pendiente") {
      matchesStatus = session.status === "pending";
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
          <h1 className="text-3xl font-bold text-foreground">Sesiones</h1>
          <p className="text-muted-foreground mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sesiones</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona y revisa todas tus sesiones
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron sesiones con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {session.profile?.full_name || "Paciente"}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
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
                      session.status === "pending"
                        ? "bg-secondary/10 text-secondary"
                        : session.status === "completed"
                        ? "bg-accent text-accent-foreground"
                        : session.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : session.status === "no_show"
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {session.status === "pending" ? "pendiente" :
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
                      <p className="text-sm font-medium text-foreground mb-1">
                        Notas de la sesión:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.session_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {session.video_link && session.status === "pending" && (
                      <Button
                        onClick={() =>
                          handleStartSession(session.id, session.video_link)
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Iniciar videollamada
                      </Button>
                    )}
                    {session.status === "pending" && (
                      <Button
                        variant="outline"
                        onClick={() => handleCompleteSession(session.id)}
                      >
                        Marcar como completada
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
    </div>
  );
}
