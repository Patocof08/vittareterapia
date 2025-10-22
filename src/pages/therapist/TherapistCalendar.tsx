import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function TherapistCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();

  type Block = { start: string; end: string };
  type DayAvailability = { dayOfWeek: number; blocks: Block[] };
  const [availability, setAvailability] = useState<DayAvailability[]>([]);

  const formatTime = (t: string) => (t ? t.slice(0, 5) : "");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setAvailability([]);
        return;
      }

      const { data: rows, error } = await supabase
        .from("psychologist_availability")
        .select("day_of_week, start_time, end_time, is_exception")
        .eq("psychologist_id", profile.id)
        .eq("is_exception", false);

      if (error) {
        console.error(error);
        return;
      }

      const grouped: Record<number, Block[]> = {};
      (rows || []).forEach((r: any) => {
        if (r.day_of_week === null) return;
        const d = r.day_of_week as number;
        (grouped[d] ||= []).push({
          start: formatTime(r.start_time as string),
          end: formatTime(r.end_time as string),
        });
      });

      const result = Object.keys(grouped)
        .map((k) => ({ dayOfWeek: Number(k), blocks: grouped[Number(k)] }))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      setAvailability(result);
    };

    load();
  }, [user]);

  const handleAddAvailability = () => {
    navigate("/onboarding-psicologo");
  };

  const handleBlockTime = () => {
    toast.info("Horario bloqueado exitosamente");
  };

  // Sesiones del día seleccionado (aún sin fuente de datos)
  const sessionsForDay: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu disponibilidad y sesiones
          </p>
        </div>
        <Button onClick={handleAddAvailability}>
          <Plus className="w-4 h-4 mr-2" />
          Configurar disponibilidad
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendario mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Sesiones del día */}
        <Card>
          <CardHeader>
            <CardTitle>
              {date ? date.toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "Selecciona una fecha"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsForDay.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No hay sesiones programadas
                </p>
                <Button size="sm" variant="outline" onClick={handleBlockTime}>
                  Bloquear horario
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionsForDay.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">
                        {session.time}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          session.status === "confirmada"
                            ? "bg-primary/10 text-primary"
                            : session.status === "pendiente"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {session.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.duration} minutos
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disponibilidad recurrente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Disponibilidad recurrente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <p className="text-muted-foreground">Aún no has configurado tu disponibilidad.</p>
          ) : (
            <div className="space-y-4">
              {availability.map((avail) => (
                <div
                  key={avail.dayOfWeek}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {daysOfWeek[avail.dayOfWeek]}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {avail.blocks.map((block, idx) => (
                        <span
                          key={idx}
                          className="text-sm bg-primary/10 text-primary px-3 py-1 rounded"
                        >
                          {block.start} - {block.end}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
