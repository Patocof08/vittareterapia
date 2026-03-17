import {
  ShieldCheck,
  VideoIcon,
  Calendar,
  FileText,
  Heart,
  Sparkles,
} from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  size?: "large" | "medium" | "small";
};

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Terapeutas verificados",
    description:
      "Cada psicólogo pasa por un proceso riguroso de verificación de cédula profesional, documentos y entrevista clínica antes de atender pacientes.",
    accent: "#12A357",
    size: "large",
  },
  {
    icon: VideoIcon,
    title: "Sesiones por video",
    description:
      "Tecnología de videollamada cifrada. Sin descargas, directamente desde tu navegador.",
    accent: "#7FCFC2",
    size: "medium",
  },
  {
    icon: FileText,
    title: "Facturación CFDI",
    description:
      "Emitimos facturas fiscales (CFDI 4.0) para todos los servicios, deducibles de impuestos.",
    accent: "#F5C243",
    size: "small",
  },
  {
    icon: Calendar,
    title: "Horarios flexibles",
    description:
      "Agenda y reagenda con facilidad, 7 días a la semana, incluyendo fines de semana.",
    accent: "#E7839D",
    size: "small",
  },
  {
    icon: Heart,
    title: "Seguimiento continuo",
    description:
      "Notas clínicas, tareas entre sesiones y seguimiento de progreso integrados en la plataforma.",
    accent: "#12A357",
    size: "medium",
  },
];

const FeatureCard = ({
  feature,
  delay,
}: {
  feature: Feature;
  delay: number;
}) => {
  const delayClass = [
    "",
    "reveal-delay-1",
    "reveal-delay-2",
    "reveal-delay-3",
    "reveal-delay-4",
    "reveal-delay-5",
  ][delay] || "";

  return (
    <div
      className={`reveal ${delayClass} group relative glass-card-dark rounded-2xl p-6 md:p-8 transition-all duration-500 cursor-default overflow-hidden`}
      style={
        {
          "--card-accent": feature.accent,
        } as React.CSSProperties
      }
    >
      {/* Glow blob on hover */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-2xl"
        style={{ background: `${feature.accent}25` }}
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${feature.accent}18`, border: `1px solid ${feature.accent}25` }}
      >
        <feature.icon
          className="w-5 h-5"
          style={{ color: feature.accent }}
        />
      </div>

      {/* Content */}
      <h3 className="font-karla font-bold text-lg text-zinc-100 mb-2 leading-snug">
        {feature.title}
      </h3>
      <p className="font-karla text-sm text-zinc-500 leading-relaxed">
        {feature.description}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${feature.accent}60, transparent)`,
        }}
      />
    </div>
  );
};

export const FeaturesSection = () => {
  const sectionRef = useReveal();

  return (
    <section
      ref={sectionRef}
      className="bg-[#0A1A10] py-24 md:py-32 relative overflow-hidden"
    >
      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(18,163,87,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="reveal text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12A357]/10 border border-[#12A357]/20 text-[#6FCB9C] text-xs font-karla uppercase tracking-wide mb-5">
            <Sparkles className="w-3 h-3" />
            Por qué elegirnos
          </div>
          <h2 className="font-erstoria text-[clamp(2rem,4.5vw,3.25rem)] text-zinc-100 leading-[1.1] tracking-[-0.02em] mb-4">
            Todo lo que necesitas
            <br />
            <span className="text-zinc-500">en un solo lugar</span>
          </h2>
          <p className="font-karla text-base text-zinc-500 leading-relaxed">
            Diseñado específicamente para el mercado mexicano, con las
            herramientas que pacientes y psicólogos realmente necesitan.
          </p>
        </div>

        {/* Bento grid — desktop: asymmetric 3-col, mobile: single col */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Large card — spans 2 cols */}
          <div className="md:col-span-2">
            <FeatureCard feature={features[0]} delay={1} />
          </div>

          {/* Medium card */}
          <div>
            <FeatureCard feature={features[1]} delay={2} />
          </div>

          {/* Three smaller cards */}
          <div>
            <FeatureCard feature={features[2]} delay={3} />
          </div>
          <div>
            <FeatureCard feature={features[3]} delay={4} />
          </div>
          <div>
            <FeatureCard feature={features[4]} delay={5} />
          </div>
        </div>
      </div>
    </section>
  );
};
