import { useState } from "react";
import { CheckSquare, Plus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockTasks } from "@/data/therapistMockData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TherapistTasks() {
  const [filter, setFilter] = useState<"todas" | "pendientes" | "completadas">(
    "todas"
  );

  const filteredTasks = mockTasks.filter((task) => {
    if (filter === "pendientes") return !task.completed;
    if (filter === "completadas") return task.completed;
    return true;
  });

  const handleCreateTask = () => {
    toast.success("Funcionalidad de crear tarea en desarrollo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tareas</h1>
          <p className="text-muted-foreground mt-1">
            Asigna y monitorea tareas para tus pacientes
          </p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Crear tarea
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === "todas" ? "default" : "outline"}
          onClick={() => setFilter("todas")}
        >
          Todas
        </Button>
        <Button
          variant={filter === "pendientes" ? "default" : "outline"}
          onClick={() => setFilter("pendientes")}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === "completadas" ? "default" : "outline"}
          onClick={() => setFilter("completadas")}
        >
          Completadas
        </Button>
      </div>

      {/* Lista de tareas */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay tareas con el filtro seleccionado
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{task.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Paciente: {task.patientName}
                    </p>
                  </div>
                  <Badge
                    variant={task.completed ? "default" : "secondary"}
                  >
                    {task.completed ? "Completada" : "Pendiente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha límite: </span>
                      <span className="font-medium text-foreground">
                        {new Date(task.dueDate).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                    <div>
                      {task.viewed ? (
                        <Badge variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Vista por paciente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No vista</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      Ver detalles
                    </Button>
                    <Button size="sm" variant="ghost">
                      Editar
                    </Button>
                    {!task.completed && (
                      <Button size="sm" variant="ghost">
                        Marcar como completada
                      </Button>
                    )}
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
