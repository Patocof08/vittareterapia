import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Star, Video, Globe, GraduationCap, Award, Heart, ArrowLeft } from "lucide-react";
import { mockTherapists } from "@/data/mockData";
import { useState } from "react";
import { toast } from "sonner";

const TherapistProfile = () => {
  const { id } = useParams();
  const therapist = mockTherapists.find((t) => t.id === id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");

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
              src={therapist.photo}
              alt={therapist.name}
              className="w-48 h-48 rounded-2xl object-cover border-4 border-primary/20 shadow-large"
            />

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{therapist.name}</h1>
                  <p className="text-xl text-muted-foreground mb-4">{therapist.specialty}</p>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 fill-secondary text-secondary mr-1" />
                      <span className="font-semibold mr-1">{therapist.rating}</span>
                      <span className="text-sm text-muted-foreground">({therapist.reviews} reseñas)</span>
                    </div>
                    <Badge variant="secondary">{therapist.availability}</Badge>
                  </div>
                </div>
                <button className="p-3 rounded-full hover:bg-accent transition-colors">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {therapist.approaches.map((approach) => (
                  <Badge key={approach} variant="outline">
                    {approach}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Award className="w-5 h-5 text-primary" />
                  <span>Cédula: {therapist.cedula}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  <span>{therapist.yearsExperience} años de experiencia</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>{therapist.languages.join(", ")}</span>
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
                <p className="text-muted-foreground leading-relaxed">{therapist.bio}</p>
              </div>

              {/* Education */}
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h2 className="text-2xl font-bold mb-4">Formación académica</h2>
                <ul className="space-y-3">
                  {therapist.education.map((edu, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <GraduationCap className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">{edu}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specialties */}
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h2 className="text-2xl font-bold mb-4">Especialidades y enfoques</h2>
                <div className="flex flex-wrap gap-2">
                  {therapist.approaches.map((approach) => (
                    <Badge key={approach} variant="secondary" className="text-sm px-4 py-2">
                      {approach}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Trabajo con personas que enfrentan ansiedad, depresión, estrés, problemas de pareja y más.
                </p>
              </div>
            </div>

            {/* Right Column - Booking */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-large p-6 border border-border sticky top-24">
                <div className="mb-6">
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-4xl font-bold">${therapist.price}</span>
                    <span className="text-muted-foreground">/ sesión</span>
                  </div>
                  <p className="text-sm text-muted-foreground">50 minutos por videollamada</p>
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
