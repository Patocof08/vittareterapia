import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function ClientTasks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mis tareas</h1>
        <p className="text-muted-foreground mt-1">
          Tareas y ejercicios asignados por tu terapeuta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Tareas Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            No tienes tareas asignadas todavía
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
