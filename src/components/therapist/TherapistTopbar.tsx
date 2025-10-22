import { Bell, Menu, Search, User, HelpCircle, Shield, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TherapistTopbarProps {
  onMenuClick?: () => void;
}

interface TherapistData {
  first_name: string | null;
  last_name: string | null;
  profile_photo_url: string | null;
  specialties: string[] | null;
}

export const TherapistTopbar = ({ onMenuClick }: TherapistTopbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [therapistData, setTherapistData] = useState<TherapistData | null>(null);

  useEffect(() => {
    const fetchTherapistData = async () => {
      if (!user) return;
      
      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("first_name, last_name, profile_photo_url, specialties")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setTherapistData(data);
      }
    };

    fetchTherapistData();
  }, [user]);
  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacientes, sesiones..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          {/* Profile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 ml-2 h-auto py-2">
                <img
                  src={therapistData?.profile_photo_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                  alt={therapistData ? `${therapistData.first_name} ${therapistData.last_name}` : "Usuario"}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {therapistData ? `${therapistData.first_name} ${therapistData.last_name}` : "Cargando..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {therapistData?.specialties?.[0] || "Psicólogo/a"}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/terapeuta/perfil")}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/terapeuta/soporte")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Ayuda</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/privacidad")}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Privacidad</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/terminos")}>
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
