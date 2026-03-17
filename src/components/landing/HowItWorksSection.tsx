import { Search, CalendarCheck, MessageCircleHeart } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Encuentra tu psicólogo",
    description:
      "Explora perfiles verificados. Filtra por especialidad, idioma, precio y modalidad. Lee reseñas reales.",
    accent: "#12A357",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Agenda tu primera cita",
    description:
      "Elige el horario que mejor se adapte a tu rutina. Recibe confirmación instantánea y recordatorio.",
    accent: "#7FCFC2",
  },
  {
    number: "03",
    icon: MessageCircleHeart,
    title: "Comienza tu proceso",
    description:
      "Conéctate por video desde cualquier dispositivo. Sin descargas. Facturación CFDI incluida.",
    accent: "#E7839D",
  },
];

export const HowItWorksSection = () => {
  const sectionRef = useReveal();

  return (
    <section
      ref={sectionRef}
      className="bg-[#0C1A12] py-24 md:py-32 relative overflow-hidden"
    >
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/20 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="reveal text-center mb-20 max-w-xl mx-auto">
          <h2 className="font-erstoria text-[clamp(2rem,4.5vw,3.25rem)] text-zinc-100 leading-[1.1] tracking-[-0.02em] mb-4">
            Tres pasos hacia
            <br />
            <span className="gradient-text-hero">tu bienestar</span>
          </h2>
          <p className="font-karla text-base text-zinc-500 leading-relaxed">
            Empezar tu proceso terapéutico nunca fue tan sencillo.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-12 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-[#12A357]/30 via-[#7FCFC2]/30 to-[#E7839D]/30 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`reveal reveal-delay-${i + 1} relative z-10 flex flex-col items-center text-center`}
              >
                {/* Number + Icon circle */}
                <div className="relative mb-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105"
                    style={{
                      background: `${step.accent}15`,
                      border: `1px solid ${step.accent}30`,
                      boxShadow: `0 0 24px ${step.accent}18`,
                    }}
                  >
                    <step.icon
                      className="w-7 h-7"
                      style={{ color: step.accent }}
                    />
                  </div>
                  {/* Step number badge */}
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-karla font-bold"
                    style={{
                      background: step.accent,
                      color: "#0A1A10",
                    }}
                  >
                    {i + 1}
                  </div>
                </div>

                <div
                  className="font-karla text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: `${step.accent}80` }}
                >
                  Paso {step.number}
                </div>

                <h3 className="font-karla font-bold text-lg text-zinc-100 mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="font-karla text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/20 to-transparent" />
    </section>
  );
};
