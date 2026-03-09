import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Mail,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/marketing/dashboard" },
  { icon: FileText, label: "Posts", path: "/marketing/posts" },
  { icon: PlusCircle, label: "Nuevo Post", path: "/marketing/posts/new" },
  { icon: Mail, label: "Suscriptores", path: "/marketing/subscribers" },
  { icon: BarChart3, label: "Estadísticas", path: "/marketing/stats" },
];

interface MarketingSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const MarketingSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: MarketingSidebarProps) => {
  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-primary">Vittare</h1>
          <p className="text-xs text-muted-foreground">Panel de Marketing</p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/marketing/dashboard"}
            onClick={isMobile ? onMobileClose : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
        {sidebarContent(false)}
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 lg:hidden">
            {sidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
};
