import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useRef, useCallback } from "react";
import { useReveal } from "@/hooks/useReveal";

const MagneticButton = ({
  children,
  to,
}: {
  children: React.ReactNode;
  to: string;
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    btn.style.transition = "transform 0.1s ease";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = "translate(0px, 0px)";
    btn.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
  }, []);

  return (
    <Link to={to}>
      <button
        ref={btnRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative px-10 py-5 bg-[#12A357] text-white font-karla font-bold text-lg rounded-2xl overflow-hidden cursor-pointer shadow-[0_0_50px_rgba(18,163,87,0.35)] hover:shadow-[0_0_80px_rgba(18,163,87,0.55)] active:scale-[0.97] transition-shadow duration-300"
      >
        <span className="relative z-10 flex items-center gap-3">
          {children}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
        </span>
        {/* Shimmer */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
        {/* Inner glow */}
        <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-white/10 to-transparent" />
      </button>
    </Link>
  );
};

export const CTASection = () => {
  const sectionRef = useReveal();

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-40 overflow-hidden"
    >
      {/* Aurora background */}
      <div className="absolute inset-0 aurora-bg" />

      {/* Layered glow blobs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none animate-glow-pulse"
        style={{
          background:
            "radial-gradient(ellipse, rgba(18,163,87,0.2) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(127,207,194,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(231,131,157,0.07) 0%, transparent 65%)",
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 hero-grid-bg opacity-40" />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="reveal max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12A357]/12 border border-[#12A357]/25 text-[#6FCB9C] text-xs font-karla uppercase tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12A357] animate-pulse" />
            Comienza hoy — sin compromiso
          </div>

          {/* Headline */}
          <h2 className="font-erstoria text-[clamp(2.4rem,6vw,4.5rem)] text-zinc-100 leading-[1.05] tracking-[-0.03em] mb-6">
            Da el primer paso
            <br />
            <span className="gradient-text-hero">hacia tu bienestar</span>
          </h2>

          <p className="reveal reveal-delay-1 font-karla text-lg text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed">
            Miles de personas ya encontraron al psicólogo ideal en Vittare.
            Tu proceso empieza con una sola sesión.
          </p>

          {/* CTA */}
          <div className="reveal reveal-delay-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <MagneticButton to="/therapists">
              Agendar primera sesión
            </MagneticButton>

            <Link
              to="/pricing"
              className="font-karla text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500 cursor-pointer"
            >
              Ver precios y planes
            </Link>
          </div>

          {/* Micro social proof */}
          <p className="reveal reveal-delay-3 font-karla text-xs text-zinc-700 mt-10">
            Sin tarjeta de crédito requerida · Cancela en cualquier momento
          </p>
        </div>
      </div>
    </section>
  );
};
