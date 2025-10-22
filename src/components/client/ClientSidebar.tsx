import { NavLink, Link } from "react-router-dom";
import { 
  Home, 
  Calendar, 
  Video, 
  MessageSquare, 
  CreditCard, 
  User, 
  LogOut,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { icon: Home, label: "Inicio", path: "/portal" },
  { icon: MessageSquare, label: "Mensajes", path: "/portal/mensajes" },
  { icon: CheckSquare, label: "Tareas", path: "/portal/tareas" },
  { icon: Calendar, label: "Agendar", path: "/portal/agendar" },
  { icon: Video, label: "Mis Sesiones", path: "/portal/sesiones" },
  { icon: CreditCard, label: "Pagos", path: "/portal/pagos" },
  { icon: User, label: "Perfil", path: "/portal/perfil" },
];

export const ClientSidebar = () => {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col">
      {/* Header */}
      <Link to="/" className="mb-8 block">
        <div className="flex items-center space-x-2 mb-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">M</span>
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
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        onClick={signOut}
      >
        <LogOut className="w-5 h-5" />
        <span>Cerrar sesión</span>
      </Button>
    </aside>
  );
};
