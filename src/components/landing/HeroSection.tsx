import { Link } from "react-router-dom";
import { ArrowRight, Star, Play } from "lucide-react";
import { useRef, useEffect } from "react";
import { useCounter } from "@/hooks/useReveal";

const StatItem = ({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) => {
  const countRef = useCounter(value);
  return (
    <div className="text-center">
      <div className="font-karla text-3xl md:text-4xl font-bold text-zinc-100 counter-value flex items-baseline gap-1 justify-center">
        <span ref={countRef}>0</span>
        <span>{suffix}</span>
      </div>
      <div className="font-karla text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
};

export const HeroSection = () => {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const blobs = hero.querySelectorAll<HTMLElement>("[data-parallax]");
      blobs.forEach((blob) => {
        const speed = parseFloat(blob.dataset.parallax || "0.3");
        blob.style.transform = `translateY(${scrollY * speed}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#0A1A10]"
    >
      {/* Grid background */}
      <div className="absolute inset-0 hero-grid-bg opacity-100" />

      {/* Gradient blobs */}
      <div
        data-parallax="0.15"
        className="absolute -top-32 left-1/3 w-[700px] h-[700px] rounded-full opacity-100 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(18,163,87,0.12) 0%, transparent 65%)",
        }}
      />
      <div
        data-parallax="0.25"
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(127,207,194,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        data-parallax="0.1"
        className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(245,194,67,0.05) 0%, transparent 65%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#12A357]/10 border border-[#12A357]/20 text-[#6FCB9C] text-sm font-karla mb-10 animate-[fade-in_0.6s_ease_forwards]">
            <span className="w-2 h-2 rounded-full bg-[#12A357] animate-pulse flex-shrink-0" />
            Plataforma de terapia online verificada en México
          </div>

          {/* Headline */}
          <h1 className="font-erstoria text-[clamp(2.8rem,7vw,5.5rem)] text-zinc-100 leading-[1.05] tracking-[-0.03em] mb-6">
            Tu bienestar mental,
            <br />
            <span className="gradient-text-hero">al alcance de todos</span>
          </h1>

          {/* Subheadline */}
          <p className="font-karla text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Conecta con psicólogos certificados en México. Sesiones por video
            desde tu hogar, con facturación CFDI y total confidencialidad.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link to="/therapists" className="block sm:inline-block">
              <button className="group relative w-full sm:w-auto px-8 py-4 bg-[#12A357] text-white font-karla font-bold text-base rounded-xl transition-all duration-300 overflow-hidden cursor-pointer shadow-[0_0_40px_rgba(18,163,87,0.3)] hover:shadow-[0_0_60px_rgba(18,163,87,0.45)] hover:bg-[#0F8A4A] active:scale-[0.98]">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Encuentra tu terapeuta
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                {/* Shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700" />
              </button>
            </Link>

            <Link to="/para-psicologos" className="block sm:inline-block">
              <button className="group w-full sm:w-auto px-8 py-4 bg-transparent text-zinc-200 font-karla font-bold text-base rounded-xl border border-zinc-700 hover:border-[#12A357]/50 hover:bg-white/[0.03] hover:text-zinc-100 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2">
                <Play className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                Soy psicólogo
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <StatItem value={500} label="Sesiones completadas" suffix="+" />
            <div className="w-px h-10 bg-zinc-800 hidden sm:block" />
            <div className="text-center">
              <div className="font-karla text-3xl md:text-4xl font-bold text-zinc-100 flex items-center gap-1.5 justify-center">
                4.9
                <Star className="w-6 h-6 text-[#F5C243] fill-[#F5C243]" />
              </div>
              <div className="font-karla text-sm text-zinc-500 mt-1">
                Calificación promedio
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800 hidden sm:block" />
            <StatItem value={100} label="Terapeutas verificados" suffix="%" />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A1A10] to-transparent pointer-events-none" />
    </section>
  );
};
