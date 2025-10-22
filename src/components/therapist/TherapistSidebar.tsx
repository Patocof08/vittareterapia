import { NavLink } from "react-router-dom";
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
  FileText,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { icon: LayoutDashboard, label: "Inicio", path: "/therapist/dashboard" },
  { icon: Calendar, label: "Calendario", path: "/therapist/calendar" },
  { icon: Video, label: "Sesiones", path: "/therapist/sessions" },
  { icon: MessageSquare, label: "Mensajes", path: "/therapist/messages", badge: 2 },
  { icon: Users, label: "Pacientes", path: "/therapist/patients" },
  { icon: DollarSign, label: "Pagos", path: "/therapist/payments" },
  { icon: BookOpen, label: "Biblioteca", path: "/therapist/library" },
  { icon: CheckSquare, label: "Tareas", path: "/therapist/tasks" },
  { icon: BarChart3, label: "Reportes", path: "/therapist/reports" },
  { icon: FileText, label: "Documentos", path: "/therapist/documents" },
  { icon: HelpCircle, label: "Soporte", path: "/therapist/support" },
];

export const TherapistSidebar = () => {
  const { signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-6 border-b border-border block">
        <h1 className="text-xl font-bold text-primary">Vittare</h1>
        <p className="text-sm text-muted-foreground">Panel de Terapeuta</p>
      </div>

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
            {item.badge && (
              <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
