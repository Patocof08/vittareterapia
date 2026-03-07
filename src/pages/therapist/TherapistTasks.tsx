import { useState, useEffect } from "react";
import { CheckCircle, Plus, Trash2, Clock, User, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Task {
  id: string;
  patient_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  patient_name?: string;
}

interface Patient {
  patient_id: string;
  full_name: string;
}

export default function TherapistTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFilter, setStatusFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    patient_id: "",
    title: "",
    description: "",
    due_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Obtener psychologist_id
      const { data: profile } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }
      setPsychologistId(profile.id);

      // Obtener pacientes
      const { data: patientsData } = await supabase.rpc("get_therapist_patients");
      setPatients(
        (patientsData || []).map((p: any) => ({
          patient_id: p.patient_id,
          full_name: p.full_name || "Sin nombre",
        }))
      );

      // Obtener tareas
      const { data: tasksData, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("psychologist_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enriquecer con nombre del paciente
      const patientIds = [...new Set((tasksData || []).map((t: any) => t.patient_id))];
      let profilesMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds);
        profilesMap = Object.fromEntries(
          (profiles || []).map((p: any) => [p.id, p.full_name || "Sin nombre"])
        );
      }

      setTasks(
        (tasksData || []).map((t: any) => ({
          ...t,
          patient_name: profilesMap[t.patient_id] || "Paciente",
        }))
      );
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!psychologistId || !formData.patient_id || !formData.title.trim()) {
      toast.error("Paciente y título son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .insert({
          psychologist_id: psychologistId,
          patient_id: formData.patient_id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: formData.due_date || null,
        });

      if (error) throw error;

      // Enviar notificación al cliente (best-effort)
      try {
        const { data: psychProfile } = await supabase
          .from("psychologist_profiles")
          .select("first_name, last_name")
          .eq("id", psychologistId)
          .single();

        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", formData.patient_id)
          .single();

        await supabase.functions.invoke("send-notification-email", {
          body: {
            notification_type: "task_assigned",
            recipient_user_id: formData.patient_id,
            variables: {
              recipient_name: clientProfile?.full_name?.split(" ")[0] || "Hola",
              psychologist_name: [psychProfile?.first_name, psychProfile?.last_name].filter(Boolean).join(" ") || "Tu psicólogo",
              task_title: formData.title.trim(),
            },
          },
        });
      } catch {
        // Notificación es best-effort
      }

      toast.success("Tarea asignada");
      setCreateOpen(false);
      setFormData({ patient_id: "", title: "", description: "", due_date: "" });
      loadData();
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error("Error al crear la tarea");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Tarea eliminada");
      loadData();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Error al eliminar la tarea");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (patientFilter !== "all" && t.patient_id !== patientFilter) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Tareas</h1>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tareas</h1>
          <p className="text-muted-foreground mt-1">
            Asigna tareas y ejercicios a tus pacientes
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva tarea
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-full md:w-52">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pacientes</SelectItem>
                {patients.map((p) => (
                  <SelectItem key={p.patient_id} value={p.patient_id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {tasks.length === 0
                  ? "No has asignado tareas todavía"
                  : "No se encontraron tareas con los filtros seleccionados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{task.title}</h3>
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status === "completed" ? "Completada" : "Pendiente"}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {task.patient_name}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Vence: {format(new Date(task.due_date + "T12:00:00"), "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                      <span>
                        Creada: {format(new Date(task.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                      {task.completed_at && (
                        <span className="text-green-600">
                          Completada: {format(new Date(task.completed_at), "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Nueva Tarea */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Asigna una tarea o ejercicio a un paciente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(v) => setFormData({ ...formData, patient_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.patient_id} value={p.patient_id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ej: Diario de emociones"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Instrucciones detalladas para el paciente..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha límite (opcional)</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Asignando..." : "Asignar tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
