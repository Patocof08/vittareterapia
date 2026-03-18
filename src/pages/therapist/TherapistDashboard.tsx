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
  const [walletBalance, setWalletBalance] = useState<number>(0);
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

          // Fetch wallet balance
          const { data: walletData } = await supabase
            .from("psychologist_wallets")
            .select("balance")
            .eq("psychologist_id", profileData.id)
            .maybeSingle();
          if (walletData) setWalletBalance(Number(walletData.balance) || 0);

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

  const unreadMessages: any[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Bienvenid{profile?.first_name?.endsWith('a') ? 'a' : 'o'} de vuelta, {profile?.first_name || ""}
        </h1>
        <p className="text-[#6B7280] mt-1">
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
        <Card className="border-0 border-t-4 border-t-[#12A357] bg-gradient-to-br from-[#F0FBF5] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Sesiones esta semana
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#12A357] shadow-sm shadow-[#12A357]/30">
              <Video className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#12A357]">{weekSessions.length}</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {weekSessions.length === 0 ? "Sin sesiones programadas aún" : `${weekSessions.length} sesión${weekSessions.length !== 1 ? 'es' : ''} programada${weekSessions.length !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-4 border-t-[#6AB7AB] bg-gradient-to-br from-[#F0F9F7] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Tasa de asistencia
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#6AB7AB] shadow-sm shadow-[#6AB7AB]/30">
              <CheckCircle className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#6AB7AB]">--</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Sin datos aún
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-4 border-t-[#D9A932] bg-gradient-to-br from-[#FEFAED] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Balance acumulado
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#D9A932] shadow-sm shadow-[#D9A932]/30">
              <DollarSign className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#D9A932]">${walletBalance.toFixed(2)}</div>
            <p className="text-xs text-[#6B7280] mt-0.5">MXN en tu wallet</p>
          </CardContent>
        </Card>

        <Card className="border-0 border-t-4 border-t-[#E7839D] bg-gradient-to-br from-[#FDF5F8] to-white shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#1F4D2E]">
              Mensajes sin leer
            </CardTitle>
            <span className="p-2.5 rounded-xl bg-[#E7839D] shadow-sm shadow-[#E7839D]/30">
              <MessageSquare className="h-4 w-4 text-white" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#E7839D]">{unreadMessagesCount}</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {unreadMessagesCount === 0 ? "Sin mensajes pendientes" : `${unreadMessagesCount} mensaje${unreadMessagesCount !== 1 ? 's' : ''} sin leer`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sesiones de hoy */}
        <Card className="border-0 border-l-4 border-l-[#12A357] shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
              <span className="p-1.5 rounded-lg bg-[#12A357]">
                <Calendar className="w-4 h-4 text-white" />
              </span>
              Sesiones de hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-[#6B7280] text-center py-8">Cargando...</p>
            ) : todaySessions.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">
                No tienes sesiones programadas para hoy
              </p>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F0FBF5] transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-[#1F4D2E]">
                        {session.patient?.full_name || "Paciente"}
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {format(new Date(session.start_time), "HH:mm", { locale: es })} - {format(new Date(session.end_time), "HH:mm", { locale: es })}
                      </p>
                      <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full font-medium ${
                        session.status === "confirmed" ? "bg-[#E8F5EE] text-[#12A357]" :
                        session.status === "completed" ? "bg-[#EFF6FF] text-[#3B82F6]" :
                        session.status === "cancelled" ? "bg-red-50 text-red-600" :
                        "bg-[#FEF9EA] text-[#D9A932]"
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
                      className="border-[#E5E7EB] text-[#1F4D2E] hover:bg-[#F0FBF5] hover:border-[#12A357]/40"
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
        <Card className="border-0 border-l-4 border-l-[#E7839D] shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
              <span className="p-1.5 rounded-lg bg-[#E7839D]">
                <MessageSquare className="w-4 h-4 text-white" />
              </span>
              Mensajes recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unreadMessages.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">
                No tienes mensajes sin leer
              </p>
            ) : (
              <div className="space-y-3">
                {unreadMessages.slice(0, 3).map((message) => (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 p-4 border border-[#E5E7EB] rounded-xl hover:bg-[#F0FBF5] transition-colors"
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

      </div>
    </div>
  );
}
