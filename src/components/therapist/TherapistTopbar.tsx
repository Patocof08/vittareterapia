import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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
  const { user } = useAuth();
  const [therapistData, setTherapistData] = useState<TherapistData | null>(null);

  useEffect(() => {
    const fetchTherapistData = async () => {
      if (!user) return;
      
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

          {/* Profile */}
          <div className="flex items-center gap-3 ml-2">
            <img
              src={therapistData?.profile_photo_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
              alt={therapistData ? `${therapistData.first_name} ${therapistData.last_name}` : "Usuario"}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground">
                {therapistData ? `${therapistData.first_name} ${therapistData.last_name}` : "Cargando..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {therapistData?.specialties?.[0] || "Psicólogo/a"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
