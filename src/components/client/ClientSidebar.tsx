import { NavLink, Link } from "react-router-dom";
import {
  Home,
  Calendar,
  Video,
  MessageSquare,
  CheckSquare,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const menuItems = [
  { icon: Home, label: "Inicio", path: "/portal" },
  { icon: Video, label: "Mis Sesiones", path: "/portal/sesiones" },
  { icon: MessageSquare, label: "Mensajes", path: "/portal/mensajes", hasUnreadBadge: true },
  { icon: CheckSquare, label: "Tareas", path: "/portal/tareas" },
  { icon: Calendar, label: "Agendar", path: "/portal/agendar" },
  { icon: Package, label: "Suscripciones", path: "/portal/suscripciones" },
];

interface ClientSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const ClientSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: ClientSidebarProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("id")
          .eq("client_id", user.id);

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
      .channel("client-sidebar-messages")
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
      <div className={`border-b border-border relative ${collapsed && !isMobile ? "px-2 py-4" : "p-4"}`}>
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <span className="font-bold text-xl text-foreground">Vittare</span>
              <p className="text-xs text-muted-foreground">Portal Cliente</p>
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
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/portal"}
            onClick={isMobile ? onMobileClose : undefined}
            title={collapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg transition-colors relative ${
                collapsed && !isMobile ? "justify-center px-2 py-3" : "px-4 py-3"
              } ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="font-medium">{item.label}</span>}
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
