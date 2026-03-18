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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
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

        // Load unread messages count
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("id")
          .eq("client_id", user.id);

        if (conversationsData && conversationsData.length > 0) {
          // Count how many conversations have unread messages
          let conversationsWithUnread = 0;
          for (const conv of conversationsData) {
            const { count } = await supabase
              .from("messages")
              .select("*", { count: 'exact', head: true })
              .eq("conversation_id", conv.id)
              .eq("is_read", false)
              .neq("sender_id", user.id);

            if (count && count > 0) {
              conversationsWithUnread++;
            }
          }

          setUnreadMessagesCount(conversationsWithUnread);
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
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Bienvenido
        </h1>
        <p className="text-[#6B7280] mt-1">
          Tu resumen de actividad
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#E5E7EB] hover:border-[#12A357]/30 hover:shadow-md transition-all cursor-pointer">
          <Link to="/portal/agendar">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#1F4D2E]">
                Agendar Sesión
              </CardTitle>
              <span className="p-2 rounded-lg bg-[#E8F5EE]">
                <Calendar className="h-4 w-4 text-[#12A357]" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#6B7280]">
                Programa tu próxima cita
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-[#E5E7EB] hover:border-[#6AB7AB]/40 hover:shadow-md transition-all cursor-pointer">
          <Link to="/portal/sesiones">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#1F4D2E]">
                Mis Sesiones
              </CardTitle>
              <span className="p-2 rounded-lg bg-[#EDF7F5]">
                <Video className="h-4 w-4 text-[#6AB7AB]" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#6B7280]">
                Ver historial y próximas citas
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-[#E5E7EB] hover:border-[#E7839D]/40 hover:shadow-md transition-all cursor-pointer">
          <Link to="/portal/mensajes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#1F4D2E]">
                Mensajes
              </CardTitle>
              <span className="p-2 rounded-lg bg-[#FDF0F4]">
                <MessageSquare className="h-4 w-4 text-[#E7839D]" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1F4D2E]">{unreadMessagesCount}</div>
              <p className="text-xs text-[#6B7280]">
                {unreadMessagesCount === 0 ? "Sin mensajes nuevos" : `${unreadMessagesCount} mensaje${unreadMessagesCount !== 1 ? 's' : ''} sin leer`}
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-[#E5E7EB] hover:border-[#D9A932]/40 hover:shadow-md transition-all cursor-pointer">
          <Link to="/portal/tareas">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#1F4D2E]">
                Mis Tareas
              </CardTitle>
              <span className="p-2 rounded-lg bg-[#FEF9EA]">
                <CheckCircle className="h-4 w-4 text-[#D9A932]" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#6B7280]">
                Ver tareas asignadas
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Próxima Sesión */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
            <span className="p-1.5 rounded-lg bg-[#E8F5EE]">
              <Video className="w-4 h-4 text-[#12A357]" />
            </span>
            Próxima Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#6B7280]">Cargando...</p>
            </div>
          ) : nextSession ? (
            <div className="flex items-start gap-4 p-4 bg-[#F0FBF5] border border-[#BFE9E2] rounded-xl">
              <img
                src={nextSession.psychologist?.profile_photo_url || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop"}
                alt={`${nextSession.psychologist?.first_name} ${nextSession.psychologist?.last_name}`}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {nextSession.psychologist?.first_name} {nextSession.psychologist?.last_name}
                </p>
                <div className="flex items-center gap-2 text-[#6B7280] mt-1">
                  <Calendar className="w-4 h-4 text-[#12A357]" />
                  <span className="text-sm">
                    {new Date(nextSession.start_time).toLocaleDateString("es-MX", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#6B7280] mt-1">
                  <Clock className="w-4 h-4 text-[#12A357]" />
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
              <p className="text-[#6B7280] mb-4">
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
        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
              <span className="p-1.5 rounded-lg bg-[#FDF0F4]">
                <MessageSquare className="w-4 h-4 text-[#E7839D]" />
              </span>
              Mensajes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-[#6B7280]">
              No tienes mensajes nuevos
            </div>
          </CardContent>
        </Card>

        {/* Tareas asignadas */}
        <Card className="border-[#E5E7EB]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
              <span className="p-1.5 rounded-lg bg-[#FEF9EA]">
                <CheckCircle className="w-4 h-4 text-[#D9A932]" />
              </span>
              Mis Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-[#6B7280]">
              No tienes tareas asignadas
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
