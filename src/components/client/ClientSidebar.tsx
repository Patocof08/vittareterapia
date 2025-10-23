import { NavLink, Link } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Video, 
  MessageSquare, 
  CheckSquare,
  Package
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

export const ClientSidebar = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get conversations for this client
        const { data: conversationsData } = await supabase
          .from("conversations")
          .select("id")
          .eq("client_id", user.id);

        if (!conversationsData || conversationsData.length === 0) return;

        const conversationIds = conversationsData.map(c => c.id);
        
        // Count unread messages (messages not sent by user and not read)
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
      .channel('client-sidebar-messages')
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
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col">
      {/* Header */}
      <Link to="/" className="mb-8 block hover:opacity-80 transition-opacity">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          <span className="font-bold text-xl text-foreground">Vittare</span>
        </div>
        <p className="text-sm text-muted-foreground ml-12">Portal Cliente</p>
      </Link>

      {/* Menu */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/portal"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
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
