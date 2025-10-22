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
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { mockTherapists } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PatientPreferences, TherapistMatch } from "@/types/preferences";
import { rankTherapists } from "@/lib/matchingAlgorithm";
import { toast } from "sonner";

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
  const [usePreferences, setUsePreferences] = useState(false);
  const [rankedMatches, setRankedMatches] = useState<TherapistMatch[]>([]);

  const specialties = ["Todos", "Psicología Clínica", "Terapia de Pareja", "Psicología Infantil"];
  const languages = ["Todos", "Español", "Inglés", "Catalán"];

  // Load saved preferences on mount and handle pending preferences from quiz
  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        // Check for pending preferences from sessionStorage (after signup)
        const pendingPrefs = sessionStorage.getItem('pending_preferences');
        if (pendingPrefs) {
          try {
            const preferences = JSON.parse(pendingPrefs);
            sessionStorage.removeItem('pending_preferences');
            
            // Save to database
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
              setUsePreferences(true);
              toast.success("Preferencias guardadas correctamente");
              return;
            }
          } catch (error) {
            console.error("Error processing pending preferences:", error);
          }
        }

        // Load existing preferences
        const { data, error } = await supabase
          .from("patient_preferences")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!error && data) {
          setSavedPreferences(data as PatientPreferences);
          setUsePreferences(true);
        }
      }
    };
    loadPreferences();
  }, [user]);

  // Recalculate matches when preferences are activated
  useEffect(() => {
    if (usePreferences && savedPreferences) {
      const matches = rankTherapists(mockTherapists, savedPreferences);
      setRankedMatches(matches);
    } else {
      setRankedMatches([]);
    }
  }, [usePreferences, savedPreferences]);

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
      const { data, error } = await supabase
        .from("patient_preferences")
        .upsert({
          user_id: user.id,
          ...preferences
        })
        .select()
        .single();

      if (error) throw error;

      setSavedPreferences(data as PatientPreferences);
      setUsePreferences(true);
      toast.success("Preferencias guardadas correctamente");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Error al guardar preferencias");
    }
  };

  const filteredTherapists = mockTherapists.filter((therapist) => {
    const matchesSearch =
      therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.approaches.some((approach) =>
        approach.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesSpecialty =
      selectedSpecialty === "all" || therapist.specialty === selectedSpecialty;

    const matchesLanguage =
      selectedLanguage === "all" ||
      therapist.languages.includes(selectedLanguage);

    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "low" && therapist.price < 800) ||
      (priceRange === "medium" && therapist.price >= 800 && therapist.price < 1000) ||
      (priceRange === "high" && therapist.price >= 1000);

    return matchesSearch && matchesSpecialty && matchesLanguage && matchesPrice;
  });

  // Determine which therapists to display
  const displayTherapists = usePreferences && rankedMatches.length > 0
    ? rankedMatches.filter(match => {
        const therapist = match.therapist;
        const matchesSearch =
          therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          therapist.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecialty = selectedSpecialty === "all" || therapist.specialty === selectedSpecialty;
        const matchesLanguage = selectedLanguage === "all" || therapist.languages.includes(selectedLanguage);
        const matchesPrice =
          priceRange === "all" ||
          (priceRange === "low" && therapist.price < 800) ||
          (priceRange === "medium" && therapist.price >= 800 && therapist.price < 1000) ||
          (priceRange === "high" && therapist.price >= 1000);
        return matchesSearch && matchesSpecialty && matchesLanguage && matchesPrice;
      })
    : filteredTherapists.map(t => ({ therapist: t, score: 0, reasons: [], matchLevel: 'compatible' as const }));

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
          <div className="mt-6">
            <Button
              onClick={() => setShowQuiz(true)}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Quiero atención personalizada (2 min)
            </Button>
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
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{displayTherapists.length}</span> terapeutas
              </p>
              {usePreferences && savedPreferences && (
                <p className="text-sm text-primary mt-1">
                  ✨ Estás viendo resultados con tu configuración guardada
                </p>
              )}
            </div>
            {savedPreferences && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUsePreferences(!usePreferences)}
              >
                {usePreferences ? 'Ver búsqueda normal' : 'Usar mis preferencias'}
              </Button>
            )}
          </div>

          {displayTherapists.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayTherapists.map((match) => (
                <TherapistCard 
                  key={match.therapist.id} 
                  {...match.therapist}
                  matchLevel={usePreferences ? match.matchLevel : undefined}
                  matchReasons={usePreferences ? match.reasons : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground mb-4">
                No se encontraron terapeutas con los filtros seleccionados.
              </p>
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
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Therapists;
