import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Video,
  MessageSquare,
  Users,
  DollarSign,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  X,
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
  { icon: CheckSquare, label: "Tareas", path: "/therapist/tasks" },
  { icon: DollarSign, label: "Pagos", path: "/therapist/payments" },
];

interface TherapistSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const TherapistSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: TherapistSidebarProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const { data: profile } = await supabase
          .from("psychologist_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profile) return;

        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("id")
          .eq("psychologist_id", profile.id);

        if (!conversationsData || conversationsData.length === 0) return;

        let conversationsWithUnread = 0;
        for (const conv of conversationsData) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          if (count && count > 0) {
            conversationsWithUnread++;
          }
        }

        setUnreadCount(conversationsWithUnread);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel("sidebar-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`border-b border-border relative ${collapsed && !isMobile ? "px-2 py-4" : "p-6"}`}>
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <h1 className="text-xl font-bold text-primary">Vittare</h1>
              <p className="text-xs text-muted-foreground">Panel de Terapeuta</p>
            </div>
          )}
        </Link>
        {isMobile && (
          <button onClick={onMobileClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={isMobile ? onMobileClose : undefined}
            title={collapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg transition-colors relative",
                collapsed && !isMobile ? "justify-center px-2 py-3" : "px-4 py-3",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
            {item.hasUnreadBadge && unreadCount > 0 && (!collapsed || isMobile) && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
            {item.hasUnreadBadge && unreadCount > 0 && collapsed && !isMobile && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle — solo desktop */}
      {!isMobile && (
        <div className="border-t border-border p-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 overflow-hidden ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 lg:hidden flex flex-col">
            {sidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
};
