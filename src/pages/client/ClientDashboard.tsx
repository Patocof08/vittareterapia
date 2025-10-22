import { Calendar, MessageSquare, Video, CreditCard, CheckCircle, Search, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [nextSession, setNextSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNextSession = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Get upcoming appointments
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", user.id)
          .in("status", ["pending", "confirmed"])
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(1);

        if (error) throw error;

        if (appointments && appointments.length > 0) {
          const appt = appointments[0];
          
          // Get psychologist info
          const { data: psychologist } = await supabase
            .from("psychologist_profiles")
            .select("first_name, last_name, profile_photo_url")
            .eq("id", appt.psychologist_id)
            .single();

          setNextSession({
            ...appt,
            psychologist,
          });
        } else {
          setNextSession(null);
        }
      } catch (error) {
        console.error("Error loading next session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNextSession();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenido
        </h1>
        <p className="text-muted-foreground mt-1">
          Tu resumen de actividad
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/agendar">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Agendar Sesión
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Programa tu próxima cita
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/sesiones">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mis Sesiones
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ver historial y próximas citas
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/mensajes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mensajes
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Chat con tu psicólogo
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/tareas">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mis Tareas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ver tareas asignadas
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Próxima Sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Próxima Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : nextSession ? (
            <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-lg">
              <img
                src={nextSession.psychologist?.profile_photo_url || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop"}
                alt={`${nextSession.psychologist?.first_name} ${nextSession.psychologist?.last_name}`}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {nextSession.psychologist?.first_name} {nextSession.psychologist?.last_name}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(nextSession.start_time).toLocaleDateString("es-MX", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(nextSession.start_time).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-3">
                  <Button asChild size="sm">
                    <Link to="/portal/sesiones">Ver detalles</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No tienes sesiones programadas
              </p>
              <Button asChild>
                <Link to="/therapists">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar terapeuta
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de contenido principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mensajes Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No tienes mensajes nuevos
            </div>
          </CardContent>
        </Card>

        {/* Tareas asignadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Mis Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No tienes tareas asignadas
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
