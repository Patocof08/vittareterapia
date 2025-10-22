import { Bell, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const AdminTopbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Panel de Administración
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestiona y verifica psicólogos
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-accent rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
