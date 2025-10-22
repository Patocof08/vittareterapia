import { useEffect, useState } from "react";
import { Video, Calendar, Clock, MapPin, X } from "lucide-react";
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
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      // Citas futuras
      const { data: upcoming, error: upcomingError } = await supabase
        .from("appointments")
        .select(`
          *,
          psychologist:psychologist_profiles(first_name, last_name, profile_photo_url)
        `)
        .eq("patient_id", user.id)
        .gte("start_time", now)
        .in("status", ["pending", "confirmed"])
        .order("start_time", { ascending: true });

      if (upcomingError) throw upcomingError;

      // Citas pasadas
      const { data: past, error: pastError } = await supabase
        .from("appointments")
        .select(`
          *,
          psychologist:psychologist_profiles(first_name, last_name, profile_photo_url)
        `)
        .eq("patient_id", user.id)
        .lt("start_time", now)
        .order("start_time", { ascending: false })
        .limit(10);

      if (pastError) throw pastError;

      setUpcomingSessions(upcoming || []);
      setPastSessions(past || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: "cancelled",
          cancelled_by: user?.id,
          cancellation_reason: "Cancelado por el paciente"
        })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Sesión cancelada");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Error al cancelar sesión");
    } finally {
      setCancelDialog(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      confirmed: { variant: "default", label: "Confirmada" },
      completed: { variant: "outline", label: "Completada" },
      cancelled: { variant: "destructive", label: "Cancelada" }
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={session.psychologist.profile_photo_url || "/placeholder.svg"}
                        alt={session.psychologist.first_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {session.psychologist.first_name} {session.psychologist.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(session.start_time), "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
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
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(session.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelDialog(session.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
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
              No tienes historial de sesiones
            </div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div key={session.id} className="p-4 border border-border rounded-lg opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <img
                        src={session.psychologist.profile_photo_url || "/placeholder.svg"}
                        alt={session.psychologist.first_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {session.psychologist.first_name} {session.psychologist.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(session.start_time), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        </div>
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

      {/* Diálogo de cancelación */}
      <AlertDialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La sesión será cancelada y el horario quedará disponible nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener sesión</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelDialog && handleCancel(cancelDialog)}>
              Sí, cancelar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
