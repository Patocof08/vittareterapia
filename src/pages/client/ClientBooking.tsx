import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientBooking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Agendar Sesión
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecciona fecha y hora disponibles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendario de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Sistema de agendamiento en desarrollo</p>
            <p className="text-sm mt-2">Próximamente podrás agendar sesiones aquí</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
