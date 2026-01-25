import { Bell, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export const AdminTopbar = ({ onMenuClick }: AdminTopbarProps) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-base lg:text-lg font-semibold text-foreground">
            Panel de Administración
          </h2>
          <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
            Gestiona y verifica psicólogos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-border">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm hidden sm:block">
            <p className="font-medium text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
