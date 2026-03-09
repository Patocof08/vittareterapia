import { Home, Users, ShieldAlert, LogOut, X, FileSpreadsheet, Megaphone, FileText, PlusCircle, Mail, ChevronDown, ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [marketingOpen, setMarketingOpen] = useState(
    location.pathname.startsWith("/admin/marketing")
  );

  const menuItems = [
    { icon: Home, label: "Dashboard", to: "/admin/dashboard" },
    { icon: Users, label: "Psicólogos", to: "/admin/verifications" },
    { icon: FileSpreadsheet, label: "Reportes Financieros", to: "/admin/financials" },
    { icon: ShieldAlert, label: "Alertas", to: "/admin/alerts" },
  ];

  const marketingItems = [
    { icon: FileText, label: "Posts", to: "/admin/marketing/posts" },
    { icon: PlusCircle, label: "Nuevo Post", to: "/admin/marketing/posts/new" },
    { icon: Mail, label: "Suscriptores", to: "/admin/marketing/subscribers" },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : "hidden lg:flex lg:flex-col w-64 bg-card border-r border-border min-h-screen";

  return (
    <aside className={sidebarClasses}>
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Panel Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Vittare</p>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={handleNavClick}
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
            </li>
          ))}

          {/* Marketing dropdown */}
          <li>
            <button
              onClick={() => setMarketingOpen(!marketingOpen)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                location.pathname.startsWith("/admin/marketing")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Megaphone className="w-5 h-5" />
              <span className="font-medium flex-1 text-left">Marketing</span>
              {marketingOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {marketingOpen && (
              <ul className="mt-1 ml-4 pl-4 border-l border-border space-y-1">
                {marketingItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
