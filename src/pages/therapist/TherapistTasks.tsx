import { CheckCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TherapistTasks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tareas Asignadas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las tareas que asignas a tus pacientes
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva tarea
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Lista de Tareas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No has asignado tareas todavía
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
