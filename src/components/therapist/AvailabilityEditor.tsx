import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Save, X, CalendarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00

interface TimeBlock {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_exception?: boolean;
  exception_date?: string;
}

interface AvailabilityEditorProps {
  psychologistId: string;
  onClose?: () => void;
}

export function AvailabilityEditor({ psychologistId, onClose }: AvailabilityEditorProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [exceptionDate, setExceptionDate] = useState<Date | undefined>(undefined);

  // New block form
  const [newBlock, setNewBlock] = useState<TimeBlock>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "13:00",
  });

  useEffect(() => {
    loadAvailability();
  }, [psychologistId]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("psychologist_availability")
        .select("*")
        .eq("psychologist_id", psychologistId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error("Error loading availability:", error);
      toast.error("Error al cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const validateBlock = (block: TimeBlock, excludeId?: string) => {
    // Validate times
    if (block.start_time >= block.end_time) {
      toast.error("La hora de inicio debe ser menor que la hora de fin");
      return false;
    }

    // Check for overlaps with existing blocks (only on same day and not exceptions)
    if (!block.is_exception) {
      const overlaps = blocks.filter(b => 
        b.id !== excludeId &&
        b.day_of_week === block.day_of_week &&
        !b.is_exception &&
        ((block.start_time < b.end_time && block.end_time > b.start_time) ||
         (b.start_time < block.end_time && b.end_time > block.start_time))
      );

      if (overlaps.length > 0) {
        toast.error("Este horario se solapa con un bloque existente");
        return false;
      }
    }

    return true;
  };

  const handleAddBlock = async () => {
    if (!validateBlock(newBlock)) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("psychologist_availability")
        .insert([{
          psychologist_id: psychologistId,
          ...newBlock,
        }])
        .select()
        .single();

      if (error) throw error;

      setBlocks([...blocks, data]);
      setShowAddDialog(false);
      setNewBlock({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "13:00",
      });
      toast.success("✅ Bloque agregado exitosamente");
    } catch (error) {
      console.error("Error adding block:", error);
      toast.error("Error al agregar bloque");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBlock = async () => {
    if (!editingBlock?.id || !validateBlock(editingBlock, editingBlock.id)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("psychologist_availability")
        .update({
          day_of_week: editingBlock.day_of_week,
          start_time: editingBlock.start_time,
          end_time: editingBlock.end_time,
        })
        .eq("id", editingBlock.id);

      if (error) throw error;

      setBlocks(blocks.map(b => b.id === editingBlock.id ? editingBlock : b));
      setEditingBlock(null);
      toast.success("✅ Bloque actualizado exitosamente");
    } catch (error) {
      console.error("Error updating block:", error);
      toast.error("Error al actualizar bloque");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("¿Estás seguro de eliminar este bloque de disponibilidad?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("psychologist_availability")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      setBlocks(blocks.filter(b => b.id !== blockId));
      toast.success("✅ Bloque eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting block:", error);
      toast.error("Error al eliminar bloque");
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!exceptionDate) {
      toast.error("Selecciona una fecha");
      return;
    }

    setSaving(true);
    try {
      const dateStr = exceptionDate.toISOString().split('T')[0];
      
      // Check if exception already exists
      const existing = blocks.find(b => 
        b.is_exception && b.exception_date === dateStr
      );

      if (existing) {
        toast.error("Ya existe una excepción para esta fecha");
        return;
      }

      const { data, error } = await supabase
        .from("psychologist_availability")
        .insert([{
          psychologist_id: psychologistId,
          is_exception: true,
          exception_date: dateStr,
          day_of_week: null,
          start_time: "00:00",
          end_time: "23:59",
        }])
        .select()
        .single();

      if (error) throw error;

      setBlocks([...blocks, data]);
      setShowExceptionDialog(false);
      setExceptionDate(undefined);
      toast.success("✅ Día bloqueado exitosamente");
    } catch (error) {
      console.error("Error adding exception:", error);
      toast.error("Error al bloquear día");
    } finally {
      setSaving(false);
    }
  };

  const groupedBlocks = blocks
    .filter(b => !b.is_exception)
    .reduce((acc, block) => {
      const day = block.day_of_week;
      if (!acc[day]) acc[day] = [];
      acc[day].push(block);
      return acc;
    }, {} as Record<number, TimeBlock[]>);

  const exceptions = blocks.filter(b => b.is_exception);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Disponibilidad</h2>
          <p className="text-muted-foreground">Configura tus horarios de atención semanales</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showExceptionDialog} onOpenChange={setShowExceptionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarOff className="w-4 h-4 mr-2" />
                Bloquear día
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bloquear día específico</DialogTitle>
                <DialogDescription>
                  Selecciona una fecha en la que no estarás disponible
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Calendar
                  mode="single"
                  selected={exceptionDate}
                  onSelect={setExceptionDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
                <Button onClick={handleAddException} disabled={saving} className="w-full">
                  Confirmar bloqueo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar horario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo bloque de disponibilidad</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo horario recurrente a tu semana
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Día de la semana</Label>
                  <Select
                    value={newBlock.day_of_week.toString()}
                    onValueChange={(v) => setNewBlock({ ...newBlock, day_of_week: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Hora inicio</Label>
                    <Input
                      type="time"
                      value={newBlock.start_time}
                      onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora fin</Label>
                    <Input
                      type="time"
                      value={newBlock.end_time}
                      onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleAddBlock} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar bloque
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Warning if no availability */}
      {blocks.filter(b => !b.is_exception).length === 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              ⚠️ Actualmente no tienes horarios disponibles para agendar sesiones. Agrega al menos un bloque de disponibilidad.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Weekly availability grid */}
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad semanal</CardTitle>
          <CardDescription>
            Tus horarios recurrentes por día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {daysOfWeek.map((day, dayIndex) => (
              <div key={dayIndex} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{day}</h3>
                  {groupedBlocks[dayIndex] && groupedBlocks[dayIndex].length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {groupedBlocks[dayIndex].length} bloque(s)
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin horarios</span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {groupedBlocks[dayIndex] && groupedBlocks[dayIndex].length > 0 ? (
                    groupedBlocks[dayIndex].map((block) => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between bg-primary/10 text-primary px-3 py-2 rounded"
                      >
                        <span className="text-sm font-medium">
                          {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingBlock(block)}
                          >
                            <span className="text-xs">✏️</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleDeleteBlock(block.id!)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No hay horarios configurados para este día
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Días bloqueados</CardTitle>
            <CardDescription>
              Fechas específicas en las que no estarás disponible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="flex items-center justify-between bg-destructive/10 text-destructive px-3 py-2 rounded"
                >
                  <span className="text-sm font-medium">
                    {exc.exception_date ? new Date(exc.exception_date + 'T00:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Fecha no disponible'}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleDeleteBlock(exc.id!)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar bloque de disponibilidad</DialogTitle>
            <DialogDescription>
              Modifica el horario de este bloque
            </DialogDescription>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Día de la semana</Label>
                <Select
                  value={editingBlock.day_of_week.toString()}
                  onValueChange={(v) => setEditingBlock({ ...editingBlock, day_of_week: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={editingBlock.start_time}
                    onChange={(e) => setEditingBlock({ ...editingBlock, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={editingBlock.end_time}
                    onChange={(e) => setEditingBlock({ ...editingBlock, end_time: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleUpdateBlock} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
