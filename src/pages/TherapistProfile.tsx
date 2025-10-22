import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Star, Video, Globe, GraduationCap, Award, Heart, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TherapistProfile = () => {
  const { id } = useParams();
  const [therapist, setTherapist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    const loadTherapist = async () => {
      try {
        // @ts-ignore - Types will regenerate automatically
        const { data, error } = await supabase
          .from("psychologist_profiles")
          .select("*")
          .eq("id", id)
          .eq("is_published", true)
          .eq("verification_status", "approved")
          .single();

        if (error) throw error;
        setTherapist(data);
      } catch (error) {
        console.error("Error loading therapist:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTherapist();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Terapeuta no encontrado</h1>
          <Link to="/therapists">
            <Button>Volver al directorio</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const availableTimes = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Por favor selecciona una fecha y hora");
      return;
    }
    toast.success("Sesión agendada correctamente. Recibirás un correo de confirmación.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back button */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/therapists" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al directorio
        </Link>
      </div>

      {/* Profile Header */}
      <section className="bg-muted/30 py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <img
              src={therapist.profile_photo_url || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"}
              alt={`${therapist.first_name} ${therapist.last_name}`}
              className="w-48 h-48 rounded-2xl object-cover border-4 border-primary/20 shadow-large"
            />

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{therapist.first_name} {therapist.last_name}</h1>
                  <p className="text-xl text-muted-foreground mb-4">{therapist.specialties?.[0] || "Psicología"}</p>
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge variant="secondary">Disponible</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {therapist.therapeutic_approaches?.map((approach: string) => (
                  <Badge key={approach} variant="outline">
                    {approach}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <span>{therapist.years_experience} años de experiencia</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>{therapist.languages?.join(", ") || "Español"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h2 className="text-2xl font-bold mb-4">Sobre mí</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {therapist.bio_extended || therapist.bio_short || "Psicólogo profesional certificado."}
                </p>
              </div>

              {/* Specialties */}
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h2 className="text-2xl font-bold mb-4">Especialidades y enfoques</h2>
                <div className="space-y-4">
                  {therapist.specialties && therapist.specialties.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Especialidades:</h3>
                      <div className="flex flex-wrap gap-2">
                        {therapist.specialties.map((specialty: string) => (
                          <Badge key={specialty} variant="secondary" className="text-sm px-4 py-2">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {therapist.therapeutic_approaches && therapist.therapeutic_approaches.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Enfoques terapéuticos:</h3>
                      <div className="flex flex-wrap gap-2">
                        {therapist.therapeutic_approaches.map((approach: string) => (
                          <Badge key={approach} variant="outline" className="text-sm px-4 py-2">
                            {approach}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {therapist.populations && therapist.populations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Poblaciones atendidas:</h3>
                      <div className="flex flex-wrap gap-2">
                        {therapist.populations.map((population: string) => (
                          <Badge key={population} variant="outline" className="text-sm px-3 py-1">
                            {population}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Booking */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-large p-6 border border-border sticky top-24">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Próximamente podrás agendar sesiones directamente</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Selecciona una fecha</h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-lg border border-border"
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Horarios disponibles</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedTime === time
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleBooking}
                    className="w-full"
                    size="lg"
                    variant="hero"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Agendar sesión
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Cancela hasta 24 horas antes sin cargo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TherapistProfile;
