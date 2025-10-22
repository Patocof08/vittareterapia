import { useEffect, useState } from "react";
import { Search, Calendar, Clock, Video, MapPin, CheckCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function TherapistSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [psychologistId, setPsychologistId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [sessions, statusFilter, searchTerm]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      // Obtener psychologist_id del usuario
      const { data: profile } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      setPsychologistId(profile.id);

      // Cargar sesiones con información del paciente
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("psychologist_id", profile.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filtrar por estado
    if (statusFilter !== "todas") {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Filtrar por búsqueda (por ahora solo filtra si hay coincidencia exacta con ID)
    if (searchTerm) {
      filtered = filtered.filter(s => {
        return s.patient_id?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredSessions(filtered);
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Sesión marcada como completada");
      loadSessions();
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Error al completar sesión");
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: "cancelled",
          cancelled_by: user?.id,
          cancellation_reason: "Cancelado por el psicólogo"
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Sesión cancelada");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error("Error al cancelar sesión");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pendiente" },
      confirmed: { className: "bg-green-100 text-green-800", label: "Confirmada" },
      completed: { className: "bg-blue-100 text-blue-800", label: "Completada" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelada" },
      rescheduled: { className: "bg-purple-100 text-purple-800", label: "Reprogramada" }
    };

    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
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
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron sesiones con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => {
            const patientName = "Paciente"; // Por privacidad, no mostramos nombre completo
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);

            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{patientName}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(startTime, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        {session.modality === "Videollamada" ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                        <span>{session.modality}</span>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
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
                      {session.status === "confirmed" && (
                        <>
                          <Button
                            onClick={() => handleCompleteSession(session.id)}
                            variant="default"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como completada
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleCancelSession(session.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar sesión
                          </Button>
                        </>
                      )}
                      {session.status === "pending" && (
                        <Button
                          onClick={() => handleCancelSession(session.id)}
                          variant="destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
