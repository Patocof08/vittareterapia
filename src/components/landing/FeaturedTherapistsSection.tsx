import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, BadgeCheck, Loader2 } from "lucide-react";

type Therapist = {
  id: string;
  first_name: string;
  last_name: string;
  specialties?: string[];
  profile_photo_url?: string;
  therapeutic_approaches?: string[];
  languages?: string[];
  years_experience?: number;
};

type RatingsMap = Record<
  string,
  { avg_rating: number; review_count: number }
>;

type Props = {
  therapists: Therapist[];
  ratingsMap: RatingsMap;
  loading: boolean;
};

const TherapistCard = ({
  therapist,
  rating,
  reviews,
  delay,
}: {
  therapist: Therapist;
  rating: number;
  reviews: number;
  delay: number;
}) => {
  const initials = `${therapist.first_name?.[0] ?? ""}${therapist.last_name?.[0] ?? ""}`;
  const specialty = therapist.specialties?.[0] ?? "Psicología general";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.65,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay,
      }}
      whileHover={{
        y: -6,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-[#1F4D2E]/8 cursor-default"
      style={{ boxShadow: "0 2px 16px rgba(31,77,46,0.06)" }}
    >
      {/* Photo area */}
      <div className="relative h-56 bg-gradient-to-br from-[#BFE9E2] via-[#98D9CF] to-[#6FCB9C] overflow-hidden">
        {therapist.profile_photo_url ? (
          <img
            src={therapist.profile_photo_url}
            alt={`${therapist.first_name} ${therapist.last_name}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-erstoria text-6xl text-white/60">
              {initials}
            </span>
          </div>
        )}

        {/* Verified badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5">
          <BadgeCheck className="w-3.5 h-3.5 text-[#12A357]" />
          <span className="font-karla text-[11px] font-bold text-[#12A357] uppercase tracking-wide">
            Verificado
          </span>
        </div>

        {/* View profile overlay */}
        <div className="absolute inset-0 bg-[#1F4D2E]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link to={`/therapist/${therapist.id}`}>
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1 }}
              className="px-6 py-3 bg-white text-[#1F4D2E] font-karla font-bold text-sm rounded-xl cursor-pointer transition-colors hover:bg-[#FAFAF8]"
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              Ver perfil
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="font-karla font-bold text-lg text-[#1F4D2E] mb-1">
          {therapist.first_name} {therapist.last_name}
        </h3>
        <p className="font-karla text-sm text-[#6D8F7A] mb-4">{specialty}</p>

        <div className="flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[#F5C243] fill-[#F5C243]" />
            <span className="font-karla font-bold text-sm text-[#1F4D2E]">
              {rating > 0 ? rating.toFixed(1) : "Nuevo"}
            </span>
            {reviews > 0 && (
              <span className="font-karla text-xs text-[#6D8F7A]">
                ({reviews})
              </span>
            )}
          </div>

          {/* Approaches pills */}
          <div className="flex gap-1.5 flex-wrap justify-end">
            {(therapist.therapeutic_approaches ?? [])
              .slice(0, 1)
              .map((a) => (
                <span
                  key={a}
                  className="font-karla text-[10px] px-2.5 py-1 rounded-full bg-[#12A357]/10 text-[#12A357] font-medium"
                >
                  {a}
                </span>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* Placeholder when no real therapists */
const placeholders = [
  { id: "p1", first_name: "Dra. Ana", last_name: "García", specialties: ["Ansiedad y estrés"], therapeutic_approaches: ["TCC"] },
  { id: "p2", first_name: "Dr. Carlos", last_name: "Méndez", specialties: ["Relaciones de pareja"], therapeutic_approaches: ["Sistémica"] },
  { id: "p3", first_name: "Dra. Laura", last_name: "Torres", specialties: ["Depresión"], therapeutic_approaches: ["ACT"] },
];

export const FeaturedTherapistsSection = ({
  therapists,
  ratingsMap,
  loading,
}: Props) => {
  const displayTherapists = therapists.length > 0 ? therapists : (placeholders as any[]);

  return (
    <section className="bg-[#FAFAF8] py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-14"
        >
          <div>
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em]">
              Psicólogos{" "}
              <span className="text-[#12A357]">destacados</span>
            </h2>
            <p className="font-karla text-base text-[#6D8F7A] mt-3 max-w-md leading-relaxed">
              Profesionales verificados, listos para acompañarte.
            </p>
          </div>
          <Link
            to="/therapists"
            className="group flex items-center gap-2 font-karla text-sm font-semibold text-[#12A357] hover:text-[#0F8A4A] transition-colors flex-shrink-0"
          >
            Ver todos los psicólogos
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-[#12A357] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTherapists.slice(0, 3).map((t, i) => (
              <TherapistCard
                key={t.id}
                therapist={t}
                rating={ratingsMap[t.id]?.avg_rating ?? 0}
                reviews={ratingsMap[t.id]?.review_count ?? 0}
                delay={i * 0.1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
