import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookingCalendar } from "@/components/client/BookingCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";

export default function ClientBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const psychologistId = searchParams.get("psychologist");
  const { user } = useAuth();
  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (psychologistId) {
          // Load pricing for the selected psychologist
          const { data: pricingData, error: pricingError } = await supabase
            .from("psychologist_pricing")
            .select("*")
            .eq("psychologist_id", psychologistId)
            .maybeSingle();

          if (pricingError) throw pricingError;
          setPricing(pricingData);
          setLoading(false);
        } else {
          // Load all psychologists the user has had appointments with
          const { data: appointments, error } = await supabase
            .from("appointments")
            .select("psychologist_id")
            .eq("patient_id", user.id);

          if (error) throw error;

          if (appointments && appointments.length > 0) {
            // Get unique psychologist IDs
            const uniquePsychologistIds = [...new Set(appointments.map(a => a.psychologist_id))];
            
            // Fetch all psychologist profiles
            const { data: psychologistData, error: psychError } = await supabase
              .from("psychologist_profiles")
              .select("id, first_name, last_name, profile_photo_url, therapeutic_approaches, specialties")
              .in("id", uniquePsychologistIds);

            if (psychError) throw psychError;
            setPsychologists(psychologistData || []);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [user, psychologistId]);

  if (psychologistId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/portal/agendar")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Agendar Sesión
            </h1>
            <p className="text-muted-foreground mt-1">
              Selecciona fecha y hora disponibles
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : (
          <BookingCalendar psychologistId={psychologistId} pricing={pricing} />
        )}
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
          {psychologists.length > 0
            ? "Agenda una nueva sesión con tus psicólogos" 
            : "Selecciona un psicólogo para agendar"}
        </p>
      </div>

      {!loading && psychologists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tus Psicólogos</h2>
          {psychologists.map((psychologist) => (
            <Card key={psychologist.id} className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={psychologist.profile_photo_url} />
                  <AvatarFallback>
                    {psychologist.first_name?.[0]}
                    {psychologist.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {psychologist.first_name} {psychologist.last_name}
                  </h3>
                  {psychologist.therapeutic_approaches && psychologist.therapeutic_approaches.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-foreground">
                        Enfoque: <span className="font-normal text-muted-foreground">{psychologist.therapeutic_approaches.join(", ")}</span>
                      </p>
                    </div>
                  )}
                  {psychologist.specialties && psychologist.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {psychologist.specialties.slice(0, 3).map((specialty: string, index: number) => (
                        <span key={index} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => navigate(`/portal/agendar?psychologist=${psychologist.id}`)}
                    className="mt-4"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar Nueva Sesión
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              ¿Quieres probar con otro psicólogo?
            </p>
            <Button onClick={() => navigate("/therapists")}>
              Buscar otro psicólogo
            </Button>
          </Card>
        </div>
      )}

      {!loading && psychologists.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no has agendado sesiones. Busca un psicólogo para comenzar.
          </p>
          <Button onClick={() => navigate("/therapists")}>
            Buscar Psicólogos
          </Button>
        </Card>
      )}
    </div>
  );
}
