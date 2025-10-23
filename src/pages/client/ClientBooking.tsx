import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookingCalendar } from "@/components/client/BookingCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function ClientBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const psychologistId = searchParams.get("psychologist");
  const { user } = useAuth();
  const [previousPsychologist, setPreviousPsychologist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreviousPsychologist = async () => {
      if (!user || psychologistId) {
        setLoading(false);
        return;
      }

      try {
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("psychologist_id")
          .eq("patient_id", user.id)
          .order("start_time", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (appointments && appointments.length > 0) {
          const { data: psychologist, error: psychError } = await supabase
            .from("psychologist_profiles")
            .select("id, first_name, last_name, profile_photo_url, bio_short, specialties")
            .eq("id", appointments[0].psychologist_id)
            .single();

          if (psychError) throw psychError;
          setPreviousPsychologist(psychologist);
        }
      } catch (error) {
        console.error("Error loading previous psychologist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreviousPsychologist();
  }, [user, psychologistId]);

  if (psychologistId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Agendar Sesión
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecciona fecha y hora disponibles
          </p>
        </div>

        <BookingCalendar psychologistId={psychologistId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Agendar Sesión
        </h1>
        <p className="text-muted-foreground mt-1">
          {previousPsychologist 
            ? "Agenda una nueva sesión con tu psicólogo" 
            : "Selecciona un psicólogo para agendar"}
        </p>
      </div>

      {!loading && previousPsychologist && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Tu Psicólogo</h2>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={previousPsychologist.profile_photo_url} />
              <AvatarFallback>
                {previousPsychologist.first_name?.[0]}
                {previousPsychologist.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {previousPsychologist.first_name} {previousPsychologist.last_name}
              </h3>
              {previousPsychologist.bio_short && (
                <p className="text-sm text-muted-foreground mt-1">
                  {previousPsychologist.bio_short}
                </p>
              )}
              {previousPsychologist.specialties && previousPsychologist.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previousPsychologist.specialties.slice(0, 3).map((specialty: string, index: number) => (
                    <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              <Button
                onClick={() => navigate(`/portal/agendar?psychologist=${previousPsychologist.id}`)}
                className="mt-4"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Nueva Sesión
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!loading && !previousPsychologist && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no has agendado sesiones. Busca un psicólogo para comenzar.
          </p>
          <Button onClick={() => navigate("/portal/psicologos")}>
            Buscar Psicólogos
          </Button>
        </Card>
      )}
    </div>
  );
}
