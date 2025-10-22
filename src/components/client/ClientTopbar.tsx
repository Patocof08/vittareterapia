import { Bell, Menu, User, HelpCircle, Shield, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ClientTopbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="lg:hidden">
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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/portal/perfil")}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/faq")}>
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
