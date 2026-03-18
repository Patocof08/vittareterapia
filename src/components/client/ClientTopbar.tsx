import { Menu, User, HelpCircle, Shield, FileText, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientTopbarProps {
  onMenuClick?: () => void;
}

export const ClientTopbar = ({ onMenuClick }: ClientTopbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setClientName(data.full_name);
      });
  }, [user]);

  const getInitials = () => {
    if (!clientName) return user?.email?.[0]?.toUpperCase() || "?";
    const parts = clientName.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB]">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <Input 
            type="search" 
            placeholder="Buscar..." 
            className="w-full"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <div className="w-10 h-10 rounded-full bg-[#E8F5EE] flex items-center justify-center aspect-square">
                  <span className="text-[#12A357] font-semibold text-sm leading-none">
                    {getInitials()}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/portal/ajustes")}>
                <User className="mr-2 h-4 w-4" />
                <span>Ajustes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/faq")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Ayuda</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/privacy")}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Privacidad</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/terms")}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Términos</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
