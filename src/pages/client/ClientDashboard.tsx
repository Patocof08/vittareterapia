import { Calendar, MessageSquare, Video, CreditCard, CheckCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenido
        </h1>
        <p className="text-muted-foreground mt-1">
          Tu resumen de actividad
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/agendar">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Agendar Sesión
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Programa tu próxima cita
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/sesiones">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mis Sesiones
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ver historial y próximas citas
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/mensajes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mensajes
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Chat con tu psicólogo
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/portal/tareas">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mis Tareas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ver tareas asignadas
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Próxima Sesión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Próxima Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No tienes sesiones programadas
            </p>
            <Button asChild>
              <Link to="/therapists">
                <Search className="w-4 h-4 mr-2" />
                Buscar terapeuta
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de contenido principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mensajes Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No tienes mensajes nuevos
            </div>
          </CardContent>
        </Card>

        {/* Tareas asignadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Mis Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No tienes tareas asignadas
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
