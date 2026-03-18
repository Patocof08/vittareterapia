import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { TherapistCard } from "@/components/TherapistCard";
import { PersonalizedQuiz } from "@/components/PersonalizedQuiz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PatientPreferences } from "@/types/preferences";
import { toast } from "sonner";
import { rankTherapists } from "@/lib/matchingAlgorithm";
import { fetchPublicProfiles } from "@/lib/psychologistQueries";
import { motion } from "framer-motion";

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
  const [ratingsMap, setRatingsMap] = useState<Record<string, { avg_rating: number; review_count: number }>>({});
  const [loading, setLoading] = useState(true);

  const specialties = ["Todos"];
  const languages = ["Todos", "Español", "Inglés"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const therapistsData = await fetchPublicProfiles();
        const therapistsError = null;

        if (!therapistsError && therapistsData) {
          setTherapists(therapistsData);
        }

        // @ts-ignore - Types will regenerate automatically
        const { data: ratingsData } = await supabase
          .from("psychologist_ratings")
          .select("psychologist_id, avg_rating, review_count");
        if (ratingsData) {
          const map: Record<string, { avg_rating: number; review_count: number }> = {};
          ratingsData.forEach((r: any) => {
            map[r.psychologist_id] = { avg_rating: Number(r.avg_rating), review_count: r.review_count };
          });
          setRatingsMap(map);
        }

        if (user) {
          const pendingPrefs = sessionStorage.getItem('pending_preferences');
          if (pendingPrefs) {
            try {
              const preferences = JSON.parse(pendingPrefs);
              sessionStorage.removeItem('pending_preferences');

              // @ts-ignore - Types will regenerate automatically
              const { data, error } = await supabase
                .from("patient_preferences")
                .upsert({ user_id: user.id, ...preferences })
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

    if (!user) {
      toast.info("Crea tu cuenta para guardar tu configuración");
      sessionStorage.setItem('pending_preferences', JSON.stringify(preferences));
      navigate('/auth');
      return;
    }

    try {
      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        .from("patient_preferences")
        .upsert({ user_id: user.id, ...preferences }, { onConflict: 'user_id' })
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
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      {showQuiz && (
        <PersonalizedQuiz
          onComplete={handleQuizComplete}
          onCancel={() => setShowQuiz(false)}
        />
      )}

      {/* Hero */}
      <section
        className="relative py-16 md:py-24 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #F0FAF8 0%, #E8F7F3 50%, #FAFAF8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-25"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] opacity-15"
            style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
          <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] opacity-10"
            style={{ background: "radial-gradient(circle, #F6E4B2 0%, transparent 65%)" }} />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
              style={{ background: "#D4F0E2", color: "#12A357" }}
            >
              Terapeutas verificados
            </div>
            <h1 className="font-erstoria text-[clamp(2rem,5vw,3.5rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.025em] mb-4 max-w-2xl">
              Encuentra tu terapeuta ideal
            </h1>
            <p className="font-karla text-lg text-[#6D8F7A] max-w-xl leading-relaxed mb-8">
              Todos nuestros terapeutas están certificados y tienen amplia experiencia. Psicólogos verificados, precios transparentes.
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(18,163,87,0.22)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowQuiz(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {savedPreferences ? "Actualizar" : "Configurar"} atención personalizada
              </motion.button>

              {savedPreferences?.is_active && (
                <>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-karla font-semibold"
                    style={{ background: "#D4F0E2", color: "#12A357" }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Mostrando recomendados
                  </div>
                  <button
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl font-karla text-sm font-medium cursor-pointer border transition-colors hover:bg-white"
                    style={{ borderColor: "#BFE9E2", color: "#6D8F7A" }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Ver todos
                  </button>
                </>
              )}

              {savedPreferences && !savedPreferences.is_active && (
                <button
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-karla text-sm font-bold cursor-pointer border-2 transition-colors hover:bg-white"
                  style={{ borderColor: "#12A357", color: "#1F4D2E" }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "#12A357" }} />
                  Activar recomendaciones
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section
        className="border-b sticky top-16 z-40 py-4"
        style={{
          background: "rgba(250,250,248,0.95)",
          borderColor: "#BFE9E2",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(18,163,87,0.05)",
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6D8F7A" }} />
              <Input
                type="text"
                placeholder="Buscar por nombre, especialidad o enfoque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#BFE9E2] focus:border-[#12A357] font-karla rounded-xl"
              />
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl font-karla text-sm font-medium cursor-pointer border"
              style={{ borderColor: "#BFE9E2", color: "#3A6A4C" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex gap-3">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-52 border-[#BFE9E2] font-karla rounded-xl">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las especialidades</SelectItem>
                  {specialties.slice(1).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-44 border-[#BFE9E2] font-karla rounded-xl">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los idiomas</SelectItem>
                  {languages.slice(1).map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-44 border-[#BFE9E2] font-karla rounded-xl">
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los precios</SelectItem>
                  <SelectItem value="low">Menos de $800</SelectItem>
                  <SelectItem value="medium">$800 – $1,000</SelectItem>
                  <SelectItem value="high">Más de $1,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile filters */}
          {showFilters && (
            <div
              className="lg:hidden mt-4 p-5 rounded-2xl border space-y-4"
              style={{ background: "#F0FAF8", borderColor: "#BFE9E2" }}
            >
              <div>
                <Label className="font-karla text-sm text-[#3A6A4C] font-medium mb-1.5 block">Especialidad</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="border-[#BFE9E2] font-karla rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    {specialties.slice(1).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-karla text-sm text-[#3A6A4C] font-medium mb-1.5 block">Idioma</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="border-[#BFE9E2] font-karla rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los idiomas</SelectItem>
                    {languages.slice(1).map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-karla text-sm text-[#3A6A4C] font-medium mb-1.5 block">Rango de precio</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="border-[#BFE9E2] font-karla rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los precios</SelectItem>
                    <SelectItem value="low">Menos de $800</SelectItem>
                    <SelectItem value="medium">$800 – $1,000</SelectItem>
                    <SelectItem value="high">Más de $1,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4 md:px-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div
                className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: "#BFE9E2", borderTopColor: "#12A357" }}
              />
            </div>
          ) : filteredTherapists.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-2">
                <span className="font-karla text-sm text-[#6D8F7A]">
                  Mostrando <span className="font-bold text-[#1F4D2E]">{filteredTherapists.length}</span> terapeuta{filteredTherapists.length !== 1 ? "s" : ""}
                </span>
                {savedPreferences?.is_active && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-karla text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: "#D4F0E2", color: "#12A357" }}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    Ordenados por compatibilidad
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTherapists.map((match) => {
                  const therapist = match.therapist;
                  const pricing = therapist.pricing?.[0];

                  return (
                    <motion.div
                      key={therapist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="relative"
                    >
                      {savedPreferences?.is_active && match.matchLevel !== 'compatible' && (
                        <div className="absolute -top-3 left-4 z-10">
                          <div
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-karla text-xs font-bold"
                            style={
                              match.matchLevel === 'top'
                                ? { background: "#D4F0E2", color: "#12A357" }
                                : { background: "#BFE9E2", color: "#6AB7AB" }
                            }
                          >
                            {match.matchLevel === 'top' ? '🌟 Excelente match' : '✨ Buen match'}
                          </div>
                        </div>
                      )}
                      <TherapistCard
                        id={therapist.id}
                        name={`${therapist.first_name} ${therapist.last_name}`}
                        specialty={therapist.specialties?.[0] || "Psicología"}
                        photo={therapist.profile_photo_url || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"}
                        rating={ratingsMap[therapist.id]?.avg_rating || 0}
                        reviews={ratingsMap[therapist.id]?.review_count || 0}
                        price={pricing?.session_price || 0}
                        approaches={therapist.therapeutic_approaches || []}
                        languages={therapist.languages || []}
                        availability="Disponible"
                      />
                      {savedPreferences?.is_active && match.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 px-1">
                          {match.reasons.slice(0, 3).map((reason: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block font-karla text-[11px] px-2.5 py-1 rounded-full border"
                              style={{ borderColor: "#BFE9E2", color: "#6D8F7A" }}
                            >
                              {reason.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <div
                className="font-erstoria text-6xl mb-6 select-none"
                style={{ color: "#BFE9E2" }}
              >
                ∅
              </div>
              <p className="font-karla text-lg text-[#6D8F7A] mb-6 max-w-md mx-auto">
                {therapists.length === 0
                  ? "Pronto encontrarás profesionales disponibles aquí. Estamos revisando nuevos perfiles."
                  : "No se encontraron terapeutas con los filtros seleccionados."}
              </p>
              {therapists.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSpecialty("all");
                    setSelectedLanguage("all");
                    setPriceRange("all");
                  }}
                  className="font-karla font-bold text-sm px-6 py-3 rounded-2xl border-2 cursor-pointer transition-colors hover:bg-white"
                  style={{ borderColor: "#12A357", color: "#1F4D2E" }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Therapists;
