import { User, Mail, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function ClientProfile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Mi Perfil
        </h1>
        <p className="text-[#6B7280] mt-1">
          Gestiona tu información personal
        </p>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
            <User className="w-5 h-5 text-[#6AB7AB]" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ""} 
              disabled
            />
          </div>

          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1F4D2E]">
            <Lock className="w-5 h-5 text-[#6B7280]" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña Actual</Label>
            <Input 
              id="current-password" 
              type="password" 
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input 
              id="new-password" 
              type="password" 
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              placeholder="••••••••"
            />
          </div>

          <Button>Cambiar Contraseña</Button>
        </CardContent>
      </Card>

      {/* Privacidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1F4D2E]">Privacidad y Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Tus datos están protegidos y solo se utilizan para proporcionar el servicio de terapia.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Descargar Mis Datos
            </Button>
            <Button variant="destructive" size="sm">
              Eliminar Cuenta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
