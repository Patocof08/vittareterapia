import { useEffect, useState } from "react";
import { Video, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientSessions() {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // @ts-ignore - Types will regenerate automatically
      const now = new Date().toISOString();

      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        // @ts-ignore - Types will regenerate automatically
        .from("appointments")
        .select(`
          *,
          psychologist_profiles!inner(
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq("patient_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      // @ts-ignore - Types will regenerate automatically
      const upcoming = data?.filter((a) => a.start_time >= now && a.status !== "cancelled") || [];
      // @ts-ignore - Types will regenerate automatically
      const past = data?.filter((a) => a.start_time < now || a.status === "completed" || a.status === "cancelled") || [];

      setUpcomingSessions(upcoming);
      setPastSessions(past);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase
        // @ts-ignore - Types will regenerate automatically
        .from("appointments")
        .update({
          status: "cancelled",
          cancelled_by: user?.id,
          cancellation_reason: "Cancelado por el paciente",
        })
        .eq("id", selectedAppointment);

      if (error) throw error;

      toast.success("Cita cancelada exitosamente");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Error al cancelar la cita");
    } finally {
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      confirmed: { label: "Confirmada", className: "bg-blue-50 text-blue-700 border-blue-200" },
      completed: { label: "Completada", className: "bg-green-50 text-green-700 border-green-200" },
      cancelled: { label: "Cancelada", className: "bg-red-50 text-red-700 border-red-200" },
      rescheduled: { label: "Reprogramada", className: "bg-purple-50 text-purple-700 border-purple-200" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Sesiones</h1>
          <p className="text-muted-foreground mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Mis Sesiones
        </h1>
        <p className="text-muted-foreground mt-1">
          Historial y próximas citas
        </p>
      </div>

      {/* Próximas Sesiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximas Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes sesiones programadas
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {session.psychologist_profiles.first_name} {session.psychologist_profiles.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(session.start_time), "dd/MM/yyyy - HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Modalidad: {session.modality === "online" ? "Videollamada" : "Presencial"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(session.status)}
                      {session.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(session.id);
                            setCancelDialogOpen(true);
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Historial de Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes sesiones completadas
            </div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {session.psychologist_profiles.first_name} {session.psychologist_profiles.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(session.start_time), "dd/MM/yyyy - HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita quedará cancelada y el horario volverá a estar disponible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAppointment}>
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
