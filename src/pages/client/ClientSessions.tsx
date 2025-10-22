import { Video, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ClientSessions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Mis Sesiones
        </h1>
        <p className="text-muted-foreground mt-1">
          Historial y próximas citas
        </p>
      </div>

      {/* Próximas Sesiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximas Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No tienes sesiones programadas
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Historial de Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Ejemplo de sesión pasada */}
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Sesión de Terapia Individual
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Clock className="w-4 h-4" />
                    <span>01/12/2025 - 10:00 AM</span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Completada
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
