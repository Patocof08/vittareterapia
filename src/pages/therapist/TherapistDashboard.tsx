import { Calendar, DollarSign, MessageSquare, Users, Video, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface TherapistProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  verification_status: string;
  is_published: boolean;
  pricing?: any[];
}

export default function TherapistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [weekSessions, setWeekSessions] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("psychologist_profiles")
          .select(`
            *,
            pricing:psychologist_pricing(*)
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          console.log("Profile data:", profileData);
          console.log("Pricing data:", profileData.pricing);
          setProfile(profileData as any);

          // Fetch sessions for today (exclude cancelled)
          const todayStart = startOfDay(new Date());
          const todayEnd = endOfDay(new Date());

          const { data: todayData } = await supabase
            .from("appointments")
            .select(`
              *,
              patient:profiles!appointments_patient_id_fkey(full_name, avatar_url)
            `)
            .eq("psychologist_id", profileData.id)
            .in("status", ["pending", "confirmed"])
            .gte("start_time", todayStart.toISOString())
            .lte("start_time", todayEnd.toISOString())
            .order("start_time", { ascending: true });

          if (todayData) {
            setTodaySessions(todayData);
          }

          // Fetch sessions for this week (exclude cancelled)
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

          const { data: weekData } = await supabase
            .from("appointments")
            .select("id")
            .eq("psychologist_id", profileData.id)
            .in("status", ["pending", "confirmed"])
            .gte("start_time", weekStart.toISOString())
            .lte("start_time", weekEnd.toISOString());

          if (weekData) {
            setWeekSessions(weekData);
          }

          // Fetch unread messages count
          const { data: conversationsData } = await supabase
            .from("conversations")
            .select("id")
            .eq("psychologist_id", profileData.id);

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
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Placeholder for future features
  const unreadMessages: any[] = [];
  const pendingTasks: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenid{profile?.first_name?.endsWith('a') ? 'a' : 'o'} de vuelta, {profile?.first_name || ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí está tu resumen del día
        </p>
      </div>

      {/* Status Alerts */}
      {profile?.verification_status === 'pending' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu perfil está en revisión. Te notificaremos cuando sea aprobado para que puedas recibir pacientes.
          </AlertDescription>
        </Alert>
      )}

      {profile?.verification_status === 'rejected' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Tu perfil fue rechazado. Por favor revisa los comentarios y actualiza tu información.</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/therapist/profile')}>
              Ver perfil
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {profile?.verification_status === 'approved' && !profile?.is_published && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu perfil fue aprobado pero no está publicado aún. Los cambios recientes requieren nueva revisión.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sesiones esta semana
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {weekSessions.length === 0 ? "Sin sesiones programadas aún" : `${weekSessions.length} sesión${weekSessions.length !== 1 ? 'es' : ''} programada${weekSessions.length !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de asistencia
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Sin datos aún
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancia por sesión
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(() => {
                if (!profile?.pricing) return 0;
                let sessionPrice = 0;
                if (Array.isArray(profile.pricing) && profile.pricing.length > 0) {
                  sessionPrice = profile.pricing[0].session_price;
                } else if (typeof profile.pricing === 'object' && 'session_price' in profile.pricing) {
                  sessionPrice = (profile.pricing as any).session_price;
                }
                // El psicólogo recibe 85% del precio de sesión
                return (sessionPrice * 0.85).toFixed(2);
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                if (!profile?.pricing) return 'Por configurar';
                if (Array.isArray(profile.pricing) && profile.pricing.length > 0) {
                  return 'Tu ganancia neta';
                }
                if (typeof profile.pricing === 'object' && 'session_price' in profile.pricing) {
                  return 'Tu ganancia neta';
                }
                return 'Por configurar';
              })()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensajes sin leer
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessagesCount}</div>
            <p className="text-xs text-muted-foreground">
              {unreadMessagesCount === 0 ? "Sin mensajes pendientes" : `${unreadMessagesCount} mensaje${unreadMessagesCount !== 1 ? 's' : ''} sin leer`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sesiones de hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Sesiones de hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Cargando...</p>
            ) : todaySessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tienes sesiones programadas para hoy
              </p>
            ) : (
              <div className="space-y-4">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {session.patient?.full_name || "Paciente"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.start_time), "HH:mm", { locale: es })} - {format(new Date(session.end_time), "HH:mm", { locale: es })}
                      </p>
                      <span className={`inline-block mt-1 text-xs px-2 py-1 rounded ${
                        session.status === "confirmed" ? "bg-green-100 text-green-800" :
                        session.status === "completed" ? "bg-blue-100 text-blue-800" :
                        session.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {session.status === "confirmed" ? "Confirmada" :
                         session.status === "completed" ? "Completada" :
                         session.status === "cancelled" ? "Cancelada" : "Pendiente"}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate("/therapist/sessions")}
                    >
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensajes recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unreadMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tienes mensajes sin leer
              </p>
            ) : (
              <div className="space-y-4">
                {unreadMessages.slice(0, 3).map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {message.patientName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {message.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0 mt-2"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tareas pendientes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tareas pendientes para pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay tareas pendientes
              </p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paciente: {task.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vence: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
