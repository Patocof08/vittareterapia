import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Star, Video, Globe, GraduationCap, Award, Heart, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookingTypeDialog } from "@/components/client/BookingTypeDialog";
import { AuthPopup } from "@/components/AuthPopup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TherapistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [therapist, setTherapist] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    const loadTherapist = async () => {
      try {
        // Load therapist profile
        // @ts-ignore - Types will regenerate automatically
        const { data: profileData, error: profileError } = await supabase
          .from("psychologist_profiles")
          .select("*")
          .eq("id", id)
          .eq("is_published", true)
          .eq("verification_status", "approved")
          .single();

        if (profileError) throw profileError;
        setTherapist(profileData);

        // Load pricing
        // @ts-ignore - Types will regenerate automatically
        const { data: pricingData } = await supabase
          .from("psychologist_pricing")
          .select("*")
          .eq("psychologist_id", id)
          .maybeSingle();
        
        if (pricingData) setPricing(pricingData);

        // Load availability
        // @ts-ignore - Types will regenerate automatically
        const { data: availabilityData } = await supabase
          .from("psychologist_availability")
          .select("*")
          .eq("psychologist_id", id)
          .order("day_of_week", { ascending: true });
        
        if (availabilityData) setAvailability(availabilityData);
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

  // Load booked appointments when date changes
  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!selectedDate || !id) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // @ts-ignore - Types will regenerate automatically
      const { data: appointments } = await supabase
        .from("appointments")
        .select("start_time, end_time")
        .eq("psychologist_id", id)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .in("status", ["pending", "confirmed"]);

      if (appointments) {
        const booked = appointments.map((apt) => {
          const start = new Date(apt.start_time);
          return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
        });
        setBookedSlots(booked);
      }
    };

    loadBookedSlots();
  }, [selectedDate, id]);

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

  // Generate available time slots based on therapist's availability
  const getAvailableTimesForDate = (date: Date | undefined) => {
    if (!date || availability.length === 0) return [];
    
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(a => 
      a.day_of_week === dayOfWeek && !a.is_exception
    );

    if (dayAvailability.length === 0) return [];

    // Generate time slots from availability
    const times: string[] = [];
    const now = new Date();
    const minimumBookingTime = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
    
    dayAvailability.forEach(slot => {
      const [startHour] = slot.start_time.split(':').map(Number);
      const [endHour] = slot.end_time.split(':').map(Number);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const slotDateTime = new Date(date);
        slotDateTime.setHours(hour, 0, 0, 0);
        
        // Skip if slot is less than 6 hours from now
        if (slotDateTime < minimumBookingTime) {
          continue;
        }

        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        // Only add if not already booked
        if (!bookedSlots.includes(timeSlot)) {
          times.push(timeSlot);
        }
      }
    });

    return times.sort();
  };

  const availableTimes = getAvailableTimesForDate(selectedDate);

  const handleBooking = () => {
    if (!user) {
      setShowAuthPopup(true);
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error("Por favor selecciona una fecha y hora");
      return;
    }
    setShowBookingDialog(true);
  };

  const handleBookingTypeConfirm = async (type: "single" | "package_4" | "package_8") => {
    if (!user || !selectedDate || !selectedTime) return;

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (pricing?.session_duration_minutes || 50));

      if (type === "single") {
        // Create single appointment
        // @ts-ignore - Types will regenerate automatically
        const { data: appointment, error } = await supabase
          .from("appointments")
          .insert({
            patient_id: user.id,
            psychologist_id: id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "pending",
            modality: "Videollamada",
          })
          .select()
          .single();

        if (error) throw error;

        // Create payment record for single session
        // @ts-ignore - Types will regenerate automatically
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            client_id: user.id,
            psychologist_id: id,
            appointment_id: appointment.id,
            amount: pricing?.session_price || 0,
            payment_type: "single_session",
            payment_status: "pending",
            description: `Sesión individual - ${format(startTime, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}`,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Crear ingreso diferido para la sesión individual
        const { error: deferredError } = await supabase.rpc("create_single_session_deferred", {
          _appointment_id: appointment.id,
          _payment_id: payment.id,
          _psychologist_id: id as string,
          _amount: pricing?.session_price || 0,
        });
        if (deferredError) {
          console.error("Error al crear ingreso diferido:", deferredError);
          toast.error("La cita fue agendada pero hubo un error al registrar el pago. Contacta a soporte.");
        }

        toast.success('Cita agendada con éxito');
        navigate('/portal/sesiones');
      } else {
        // Create package checkout - first create pending payment for package
        const sessionsTotal = type === "package_4" ? 4 : 8;
        const packagePrice = type === "package_4" ? pricing?.package_4_price : pricing?.package_8_price;
        const paymentType = type === "package_4" ? "package_4" : "package_8";

        // Store appointment data temporarily in localStorage for checkout
        const tempAppointmentData = {
          psychologist_id: id as string,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          package_type: type,
          sessions_total: sessionsTotal,
        };
        localStorage.setItem("pending_package_appointment", JSON.stringify(tempAppointmentData));

        // Create payment record for package
        // @ts-ignore - Types will regenerate automatically
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            client_id: user.id,
            psychologist_id: id,
            amount: packagePrice || 0,
            payment_type: paymentType,
            payment_status: "pending",
            currency: "MXN",
            description: `Paquete de ${sessionsTotal} sesiones`,
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Redirect to checkout
        navigate(`/portal/checkout?payment_id=${payment.id}`);
      }
    } catch (error: any) {
      console.error("Error booking:", error);
      toast.error(error.message || "Error al procesar la reserva");
    }
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
                  <p className="text-xl text-muted-foreground mb-2">
                    Enfoque: {therapist.therapeutic_approaches?.[0] || 'No especificado'}
                  </p>
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge variant="secondary">Disponible</Badge>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {therapist.specialties?.map((specialty: string) => (
                  <Badge key={specialty} variant="secondary" className="text-[10px] px-2 py-0.5">
                    {specialty}
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
                {/* Pricing */}
                {pricing && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <h3 className="font-semibold mb-3">Precios</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Sesión individual</span>
                        <span className="text-2xl font-bold">${pricing.session_price} {pricing.currency}</span>
                      </div>
                      {pricing.first_session_price && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Primera sesión</span>
                          <span className="text-lg font-semibold text-primary">${pricing.first_session_price} {pricing.currency}</span>
                        </div>
                      )}
                      {pricing.package_4_price && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Paquete 4 sesiones</span>
                          <span className="text-lg font-semibold">${pricing.package_4_price} {pricing.currency}</span>
                        </div>
                      )}
                      {pricing.package_8_price && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Paquete 8 sesiones</span>
                          <span className="text-lg font-semibold">${pricing.package_8_price} {pricing.currency}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Duración: {pricing.session_duration_minutes} minutos
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona una fecha y hora para agendar tu sesión
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Selecciona una fecha</h3>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-lg border border-border pointer-events-auto"
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);
                        return checkDate < today;
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Horarios disponibles</h3>
                    {availableTimes.length > 0 ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay horarios disponibles para esta fecha
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleBooking}
                    className="w-full"
                    size="lg"
                    variant="hero"
                    disabled={availableTimes.length === 0}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Agendar sesión
                  </Button>

                  {pricing && (
                    <p className="text-xs text-center text-muted-foreground">
                      {pricing.cancellation_policy || "Cancela hasta 24 horas antes sin cargo"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Booking Type Dialog */}
      {pricing && (
        <BookingTypeDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          pricing={pricing}
          onConfirm={handleBookingTypeConfirm}
        />
      )}

      {/* Auth Popup */}
      <AuthPopup isOpen={showAuthPopup} onClose={() => setShowAuthPopup(false)} />
    </div>
  );
};

export default TherapistProfile;
