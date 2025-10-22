import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingCalendar } from "@/components/client/BookingCalendar";
import { toast } from "sonner";

export default function ClientBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const psychologistId = searchParams.get("psychologist");
  
  const [psychologist, setPsychologist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!psychologistId) {
      navigate("/therapists");
      return;
    }
    loadPsychologist();
  }, [psychologistId]);

  const loadPsychologist = async () => {
    try {
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("*, pricing:psychologist_pricing(*)")
        .eq("id", psychologistId)
        .single();

      if (error) throw error;
      setPsychologist(data);
    } catch (error) {
      console.error("Error loading psychologist:", error);
      toast.error("Error al cargar información del psicólogo");
      navigate("/therapists");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!psychologist) return null;

  const pricing = psychologist.pricing?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Agendar sesión con {psychologist.first_name} {psychologist.last_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecciona fecha, hora y modalidad de tu sesión
        </p>
      </div>

      <BookingCalendar
        psychologistId={psychologist.id}
        psychologistName={`${psychologist.first_name} ${psychologist.last_name}`}
        sessionPrice={pricing?.session_price || 0}
        sessionDuration={pricing?.session_duration_minutes || 50}
        modalities={psychologist.modalities || ["Videollamada"]}
        onBookingComplete={() => {
          navigate("/client/sessions");
        }}
      />
    </div>
  );
}
