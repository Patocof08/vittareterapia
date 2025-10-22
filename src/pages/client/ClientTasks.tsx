import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Calendar, User } from "lucide-react";
import { mockClientTasks } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function ClientTasks() {
  const [filter, setFilter] = useState<"todas" | "pendientes" | "completadas">("todas");
  const { toast } = useToast();

  const filteredTasks = mockClientTasks.filter(task => {
    if (filter === "pendientes") return task.status === "pendiente";
    if (filter === "completadas") return task.status === "completada";
    return true;
  });

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    toast({
      title: currentStatus === "pendiente" ? "Tarea completada" : "Tarea marcada como pendiente",
      description: "El cambio se ha guardado correctamente",
    });
  };

  const pendingCount = mockClientTasks.filter(t => t.status === "pendiente").length;
  const completedCount = mockClientTasks.filter(t => t.status === "completada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Mis Tareas</h1>
        <p className="text-muted-foreground">
          Aquí encontrarás las tareas asignadas por tu terapeuta
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Tareas por completar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Tareas finalizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === "todas" ? "default" : "outline"}
          onClick={() => setFilter("todas")}
          size="sm"
        >
          Todas ({mockClientTasks.length})
        </Button>
        <Button
          variant={filter === "pendientes" ? "default" : "outline"}
          onClick={() => setFilter("pendientes")}
          size="sm"
        >
          Pendientes ({pendingCount})
        </Button>
        <Button
          variant={filter === "completadas" ? "default" : "outline"}
          onClick={() => setFilter("completadas")}
          size="sm"
        >
          Completadas ({completedCount})
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Circle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {filter === "pendientes" && "¡Excelente! No tienes tareas pendientes."}
                {filter === "completadas" && "Aún no has completado ninguna tarea."}
                {filter === "todas" && "No tienes tareas asignadas en este momento."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-1"
                    >
                      {task.status === "completada" ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-lg ${
                          task.status === "completada" ? "line-through text-muted-foreground" : ""
                        }`}>
                          {task.title}
                        </h3>
                        <Badge variant={task.status === "completada" ? "secondary" : "default"}>
                          {task.status === "completada" ? "Completada" : "Pendiente"}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{task.therapistName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Fecha límite: {task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
