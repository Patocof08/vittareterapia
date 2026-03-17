import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { TherapistCard } from "@/components/TherapistCard";
import { useReveal } from "@/hooks/useReveal";

type Therapist = {
  id: string;
  first_name: string;
  last_name: string;
  specialties?: string[];
  profile_photo_url?: string;
  therapeutic_approaches?: string[];
  languages?: string[];
};

type RatingsMap = Record<string, { avg_rating: number; review_count: number }>;

type Props = {
  therapists: Therapist[];
  ratingsMap: RatingsMap;
  loading: boolean;
};

export const FeaturedTherapistsSection = ({
  therapists,
  ratingsMap,
  loading,
}: Props) => {
  const sectionRef = useReveal();

  return (
    <section
      ref={sectionRef}
      className="bg-[#0C1A12] py-24 md:py-32 relative overflow-hidden"
    >
      {/* Subtle divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="reveal flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-14">
          <div>
            <h2 className="font-erstoria text-[clamp(2rem,4.5vw,3.25rem)] text-zinc-100 leading-[1.1] tracking-[-0.02em]">
              Psicólogos{" "}
              <span className="text-zinc-500">destacados</span>
            </h2>
            <p className="font-karla text-base text-zinc-500 mt-3 max-w-lg">
              Profesionales verificados listos para acompañarte en tu proceso.
            </p>
          </div>
          <Link
            to="/therapists"
            className="group flex items-center gap-2 font-karla text-sm text-[#6FCB9C] hover:text-[#12A357] transition-colors flex-shrink-0"
          >
            Ver todos los profesionales
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="reveal flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#12A357] animate-spin" />
          </div>
        ) : therapists.length > 0 ? (
          <div className="reveal reveal-delay-1 grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
            {therapists.map((therapist) => (
              <TherapistCard
                key={therapist.id}
                id={therapist.id}
                name={`${therapist.first_name} ${therapist.last_name}`}
                specialty={therapist.specialties?.[0] || "Psicología"}
                photo={
                  therapist.profile_photo_url ||
                  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"
                }
                rating={ratingsMap[therapist.id]?.avg_rating || 0}
                reviews={ratingsMap[therapist.id]?.review_count || 0}
                price={0}
                approaches={therapist.therapeutic_approaches || []}
                languages={therapist.languages || []}
                availability="Disponible"
              />
            ))}
          </div>
        ) : (
          <div className="reveal flex flex-col items-center justify-center py-20 text-center">
            <p className="font-karla text-zinc-500 mb-2">
              Pronto encontrarás profesionales disponibles aquí.
            </p>
            <p className="font-karla text-sm text-zinc-600">
              Estamos revisando nuevos perfiles.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
