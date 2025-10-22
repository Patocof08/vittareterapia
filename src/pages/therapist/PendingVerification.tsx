import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Mail, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function PendingVerification() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Clock className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Perfil en Verificación</CardTitle>
          <CardDescription>
            Tu registro ha sido completado exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <FileCheck className="h-4 w-4" />
            <AlertDescription>
              <strong>¡Gracias por completar tu registro!</strong>
              <br />
              Tu perfil está siendo revisado por nuestro equipo de verificación.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">¿Qué sigue?</h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Revisión de documentos</p>
                  <p className="text-sm text-muted-foreground">
                    Verificaremos tu cédula profesional y documentación
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Aprobación del perfil</p>
                  <p className="text-sm text-muted-foreground">
                    El equipo de Vittare revisará tu información profesional
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Activación de cuenta</p>
                  <p className="text-sm text-muted-foreground">
                    Te notificaremos por correo cuando tu perfil esté activo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Tiempo estimado:</strong> 24-48 horas hábiles
              <br />
              Recibirás un correo electrónico cuando tu perfil sea aprobado.
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Si tienes alguna pregunta, no dudes en contactarnos a soporte@vittare.com
            </p>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
