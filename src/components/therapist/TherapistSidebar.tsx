import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Video,
  MessageSquare,
  Users,
  DollarSign,
  BookOpen,
  CheckSquare,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Inicio", path: "/therapist/dashboard" },
  { icon: Calendar, label: "Calendario", path: "/therapist/calendar" },
  { icon: Video, label: "Sesiones", path: "/therapist/sessions" },
  { icon: MessageSquare, label: "Mensajes", path: "/therapist/messages", hasUnreadBadge: true },
  { icon: Users, label: "Pacientes", path: "/therapist/patients" },
  { icon: DollarSign, label: "Pagos", path: "/therapist/payments" },
  { icon: BookOpen, label: "Biblioteca", path: "/therapist/library" },
  { icon: CheckSquare, label: "Tareas", path: "/therapist/tasks" },
  { icon: BarChart3, label: "Reportes", path: "/therapist/reports" },
];

export const TherapistSidebar = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get psychologist profile
        const { data: profile } = await supabase
          .from("psychologist_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile) return;

        // Get conversations
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("id")
          .eq("psychologist_id", profile.id);

        if (!conversationsData || conversationsData.length === 0) return;

        const conversationIds = conversationsData.map(c => c.id);
        
        // Count unread messages
        const { count } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .in("conversation_id", conversationIds)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sidebar-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <Link to="/" className="p-6 border-b border-border block hover:opacity-80 transition-opacity">
        <h1 className="text-xl font-bold text-primary">Vittare</h1>
        <p className="text-sm text-muted-foreground">Panel de Terapeuta</p>
      </Link>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.hasUnreadBadge && unreadCount > 0 && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
