import { useState, useEffect } from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  psychologist_name?: string;
}

export default function ClientTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: tasksData, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, due_date, completed_at, created_at, psychologist_id")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Obtener nombres de psicólogos
      const psychIds = [...new Set((tasksData || []).map((t: any) => t.psychologist_id))];
      let psychMap: Record<string, string> = {};
      if (psychIds.length > 0) {
        const { data: profiles } = await supabase
          .from("psychologist_profiles")
          .select("id, first_name, last_name")
          .in("id", psychIds);
        psychMap = Object.fromEntries(
          (profiles || []).map((p: any) => [
            p.id,
            [p.first_name, p.last_name].filter(Boolean).join(" ") || "Tu psicólogo",
          ])
        );
      }

      setTasks(
        (tasksData || []).map((t: any) => ({
          ...t,
          psychologist_name: psychMap[t.psychologist_id] || "Tu psicólogo",
        }))
      );
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;
      toast.success("¡Tarea completada!");
      loadTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Error al completar la tarea");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Mis tareas</h1>
        <p className="text-[#6B7280]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F4D2E]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Mis tareas</h1>
          <p className="text-[#6B7280] mt-1">
            Tareas y ejercicios asignados por tu terapeuta
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-sm">
            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filtro */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-[#D9A932] mx-auto mb-4" />
              <p className="text-[#6B7280]">
                {tasks.length === 0
                  ? "No tienes tareas asignadas todavía"
                  : "No hay tareas con el filtro seleccionado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue =
              task.status === "pending" &&
              task.due_date &&
              new Date(task.due_date + "T23:59:59") < new Date();

            return (
              <Card
                key={task.id}
                className={`border-0 border-l-4 shadow-sm hover:shadow-md transition-all ${
                  isOverdue ? "border-l-red-400" :
                  task.status === "completed" ? "border-l-[#6AB7AB]" :
                  "border-l-[#D9A932]"
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Ícono de estado */}
                    <div className="mt-1">
                      {task.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#6B7280]" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold text-lg ${
                            task.status === "completed" ? "line-through text-[#6B7280]" : ""
                          }`}
                        >
                          {task.title}
                        </h3>
                        {isOverdue && (
                          <Badge variant="destructive">Vencida</Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-[#6B7280] mb-3 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-[#6B7280]">
                        <span>De: {task.psychologist_name}</span>
                        {task.due_date && (
                          <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                            <Clock className="w-3.5 h-3.5" />
                            Vence: {format(new Date(task.due_date + "T12:00:00"), "d MMM yyyy", { locale: es })}
                          </span>
                        )}
                        {task.completed_at && (
                          <span className="text-green-600">
                            Completada: {format(new Date(task.completed_at), "d MMM yyyy", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón completar */}
                    {task.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(task.id)}
                        className="flex-shrink-0"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
