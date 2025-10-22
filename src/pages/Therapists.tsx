import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TherapistCard } from "@/components/TherapistCard";
import { PersonalizedQuiz } from "@/components/PersonalizedQuiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PatientPreferences } from "@/types/preferences";
import { toast } from "sonner";
import { rankTherapists } from "@/lib/matchingAlgorithm";
import { Badge } from "@/components/ui/badge";
import { fetchPublicProfiles } from "@/lib/psychologistQueries";

const Therapists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [savedPreferences, setSavedPreferences] = useState<PatientPreferences | null>(null);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const specialties = ["Todos"];
  const languages = ["Todos", "Español", "Inglés"];

  // Load therapists and preferences
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load therapists with pricing
        // Fetch public profiles securely (excludes email/phone)
        const therapistsData = await fetchPublicProfiles();
        const therapistsError = null;

        if (!therapistsError && therapistsData) {
          setTherapists(therapistsData);
        }

        // Load preferences if user is logged in
        if (user) {
          const pendingPrefs = sessionStorage.getItem('pending_preferences');
          if (pendingPrefs) {
            try {
              const preferences = JSON.parse(pendingPrefs);
              sessionStorage.removeItem('pending_preferences');
              
              // @ts-ignore - Types will regenerate automatically
              const { data, error } = await supabase
                .from("patient_preferences")
                .upsert({
                  user_id: user.id,
                  ...preferences
                })
                .select()
                .single();

              if (!error && data) {
                setSavedPreferences(data as PatientPreferences);
                toast.success("Preferencias guardadas correctamente");
                return;
              }
            } catch (error) {
              console.error("Error processing pending preferences:", error);
            }
          }

          // @ts-ignore - Types will regenerate automatically
          const { data, error } = await supabase
            .from("patient_preferences")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!error && data) {
            setSavedPreferences(data as PatientPreferences);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleQuizComplete = async (preferences: Omit<PatientPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setShowQuiz(false);

    // If not logged in, redirect to auth
    if (!user) {
      toast.info("Crea tu cuenta para guardar tu configuración");
      // Store preferences in sessionStorage temporarily
      sessionStorage.setItem('pending_preferences', JSON.stringify(preferences));
      navigate('/auth');
      return;
    }

    // Save preferences to database
    try {
      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        .from("patient_preferences")
        .upsert(
          {
            user_id: user.id,
            ...preferences
          },
          {
            onConflict: 'user_id'
          }
        )
        .select()
        .single();

      if (error) throw error;

      setSavedPreferences(data as PatientPreferences);
      toast.success("Preferencias guardadas correctamente");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Error al guardar preferencias");
    }
  };

  // Apply matching algorithm if preferences exist AND are active
  const rankedTherapists = savedPreferences?.is_active
    ? rankTherapists(
        therapists.map(t => {
          const pricing = t.pricing?.[0];
          return {
            id: t.id,
            name: `${t.first_name} ${t.last_name}`,
            specialty: t.specialties?.[0] || "Psicología",
            approaches: t.therapeutic_approaches || [],
            languages: t.languages || [],
            price: pricing?.session_price || 0,
            availability: "Disponible",
            ...t
          };
        }),
        savedPreferences
      )
    : therapists.map(t => {
        const pricing = t.pricing?.[0];
        return {
          therapist: {
            id: t.id,
            name: `${t.first_name} ${t.last_name}`,
            specialty: t.specialties?.[0] || "Psicología",
            approaches: t.therapeutic_approaches || [],
            languages: t.languages || [],
            price: pricing?.session_price || 0,
            availability: "Disponible",
            ...t
          },
          score: 0,
          reasons: [],
          matchLevel: 'compatible' as const
        };
      });

  const filteredTherapists = rankedTherapists.filter((match) => {
    const therapist = match.therapist;
    const fullName = `${therapist.first_name} ${therapist.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      therapist.specialties?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      therapist.therapeutic_approaches?.some((a: string) => a.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty =
      selectedSpecialty === "all" || therapist.specialties?.includes(selectedSpecialty);

    const matchesLanguage =
      selectedLanguage === "all" || therapist.languages?.includes(selectedLanguage);

    return matchesSearch && matchesSpecialty && matchesLanguage;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {showQuiz && (
        <PersonalizedQuiz
          onComplete={handleQuizComplete}
          onCancel={() => setShowQuiz(false)}
        />
      )}

      {/* Header */}
      <section className="bg-muted/30 py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Encuentra tu terapeuta ideal</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Todos nuestros terapeutas están certificados y tienen amplia experiencia.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <Button
              onClick={() => setShowQuiz(true)}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {savedPreferences ? 'Actualizar' : 'Configurar'} atención personalizada (2 min)
            </Button>
            {savedPreferences && savedPreferences.is_active && (
              <>
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Mostrando recomendados
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (user) {
                      await supabase
                        .from("patient_preferences")
                        .update({ is_active: false })
                        .eq("user_id", user.id);
                      setSavedPreferences({ ...savedPreferences, is_active: false });
                      toast.success("Mostrando todos los terapeutas");
                    }
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Ver todos
                </Button>
              </>
            )}
            {savedPreferences && !savedPreferences.is_active && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (user) {
                    await supabase
                      .from("patient_preferences")
                      .update({ is_active: true })
                      .eq("user_id", user.id);
                    setSavedPreferences({ ...savedPreferences, is_active: true });
                    toast.success("Recomendaciones activadas");
                  }
                }}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Activar recomendaciones
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 bg-background sticky top-16 z-40 border-b border-border shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nombre, especialidad o enfoque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
            </Button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-4">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las especialidades</SelectItem>
                  {specialties.slice(1).map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los idiomas</SelectItem>
                  {languages.slice(1).map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="low">Menos de $800</SelectItem>
                  <SelectItem value="medium">$800 - $1000</SelectItem>
                  <SelectItem value="high">Más de $1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 p-4 bg-muted rounded-lg space-y-4">
              <div>
                <Label>Especialidad</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    {specialties.slice(1).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Idioma</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los idiomas</SelectItem>
                    {languages.slice(1).map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rango de precio</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los precios</SelectItem>
                    <SelectItem value="low">Menos de $800</SelectItem>
                    <SelectItem value="medium">$800 - $1000</SelectItem>
                    <SelectItem value="high">Más de $1000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredTherapists.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{filteredTherapists.length}</span> terapeutas
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTherapists.map((match) => {
                  const therapist = match.therapist;
                  const pricing = therapist.pricing?.[0];
                  
                  return (
                  <div key={therapist.id} className="relative">
                      {savedPreferences?.is_active && match.matchLevel !== 'compatible' && (
                        <div className="absolute -top-3 left-4 z-10">
                          <Badge 
                            variant={match.matchLevel === 'top' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {match.matchLevel === 'top' ? '🌟 Excelente match' : '✨ Buen match'}
                          </Badge>
                        </div>
                      )}
                      <TherapistCard 
                        id={therapist.id}
                        name={`${therapist.first_name} ${therapist.last_name}`}
                        specialty={therapist.specialties?.[0] || "Psicología"}
                        photo={therapist.profile_photo_url || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"}
                        rating={0}
                        reviews={0}
                        price={pricing?.session_price || 0}
                        approaches={therapist.therapeutic_approaches || []}
                        languages={therapist.languages || []}
                        availability="Disponible"
                      />
                      {savedPreferences?.is_active && match.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.reasons.slice(0, 3).map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground mb-4">
                {therapists.length === 0 
                  ? "Pronto encontrarás profesionales disponibles aquí. Estamos revisando nuevos perfiles."
                  : "No se encontraron terapeutas con los filtros seleccionados."}
              </p>
              {therapists.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSpecialty("all");
                    setSelectedLanguage("all");
                    setPriceRange("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Therapists;
