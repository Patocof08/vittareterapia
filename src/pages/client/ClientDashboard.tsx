import { Calendar, MessageSquare, Video, CreditCard, CheckCircle, Clock, User, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { mockClientTasks, mockClientTherapists } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboard() {
  const pendingTasks = mockClientTasks.filter((t) => !t.completed);
  const completedTasks = mockClientTasks.filter((t) => t.completed);

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
          <Link to="/portal/pagos">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pagos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Gestiona tus pagos
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
              <Link to="/portal/agendar">Agendar sesión</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de contenido principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mis Terapeutas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Mis Terapeutas
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockClientTherapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="flex flex-col gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={therapist.photo}
                      alt={therapist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{therapist.name}</p>
                      <p className="text-sm text-muted-foreground">{therapist.specialty}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {therapist.totalSessions} sesiones realizadas
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link to="/portal/agendar">
                        <Calendar className="w-4 h-4 mr-2" />
                        Agendar sesión
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/portal/mensajes">
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/therapists">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar otro terapeuta
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Tareas asignadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Mis Tareas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockClientTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tienes tareas asignadas
            </p>
          ) : (
            <div className="space-y-6">
              {/* Tareas pendientes */}
              {pendingTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pendientes ({pendingTasks.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 border-2 border-muted-foreground rounded-full flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{task.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-xs text-muted-foreground">
                                  Asignada por: {task.therapistName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Vence: {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Marcar completada
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tareas completadas */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Completadas ({completedTasks.length})
                  </h3>
                  <div className="space-y-3">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 border border-border rounded-lg bg-accent/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckCircle className="w-3 h-3 text-primary-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground line-through">
                                {task.title}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-xs text-muted-foreground">
                                  Asignada por: {task.therapistName}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Completada el {new Date(task.completedDate!).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
