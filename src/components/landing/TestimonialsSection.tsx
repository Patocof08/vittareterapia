import { Star, Quote } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";

const testimonials = [
  {
    name: "Sofía R.",
    role: "Paciente, 28 años",
    text: "Encontré a mi terapeuta en menos de una hora. El proceso fue muy sencillo y la sesión superó mis expectativas. Por fin me atreví a pedir ayuda.",
    rating: 5,
    initials: "SR",
    accent: "#12A357",
  },
  {
    name: "Miguel A.",
    role: "Paciente, 35 años",
    text: "La plataforma es muy intuitiva y la calidad de los terapeutas es excelente. Llevo 3 meses en sesiones y los cambios en mi vida han sido notables.",
    rating: 5,
    initials: "MA",
    accent: "#7FCFC2",
  },
  {
    name: "Carmen L.",
    role: "Paciente, 42 años",
    text: "Como mamá con agenda complicada, poder agendar por las noches o fines de semana fue clave. La factura CFDI también me ayuda a deducirlo.",
    rating: 5,
    initials: "CL",
    accent: "#E7839D",
  },
  {
    name: "David T.",
    role: "Paciente, 24 años",
    text: "Al principio tenía dudas sobre la terapia online, pero la experiencia fue igual de profunda que en persona. Mi psicólogo es increíble.",
    rating: 5,
    initials: "DT",
    accent: "#F5C243",
  },
  {
    name: "Andrea M.",
    role: "Paciente, 31 años",
    text: "Llevaba años queriendo iniciar terapia pero el costo siempre era un obstáculo. En Vittare encontré opciones accesibles y de calidad.",
    rating: 5,
    initials: "AM",
    accent: "#12A357",
  },
  {
    name: "Roberto C.",
    role: "Paciente, 47 años",
    text: "Tuve una crisis en el trabajo y en días pude tener mi primera cita. El equipo de soporte fue muy atento durante todo el proceso.",
    rating: 5,
    initials: "RC",
    accent: "#7FCFC2",
  },
];

const doubledTestimonials = [...testimonials, ...testimonials];

const TestimonialCard = ({ t }: { t: (typeof testimonials)[0] }) => (
  <div className="group flex-shrink-0 w-[300px] md:w-[340px] glass-card-dark rounded-2xl p-6 transition-all duration-500 cursor-default mx-3">
    {/* Stars */}
    <div className="flex gap-1 mb-4">
      {Array.from({ length: t.rating }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 text-[#F5C243] fill-[#F5C243]" />
      ))}
    </div>

    {/* Quote */}
    <Quote
      className="w-5 h-5 mb-3 opacity-20"
      style={{ color: t.accent }}
    />
    <p className="font-karla text-sm text-zinc-400 leading-relaxed mb-6 line-clamp-4">
      {t.text}
    </p>

    {/* Author */}
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-karla font-bold flex-shrink-0"
        style={{ background: `${t.accent}20`, color: t.accent }}
      >
        {t.initials}
      </div>
      <div>
        <div className="font-karla font-bold text-sm text-zinc-200">
          {t.name}
        </div>
        <div className="font-karla text-xs text-zinc-600">{t.role}</div>
      </div>
    </div>
  </div>
);

export const TestimonialsSection = () => {
  const sectionRef = useReveal();

  return (
    <section
      ref={sectionRef}
      className="bg-[#0A1A10] py-24 md:py-32 overflow-hidden relative"
    >
      <div className="container mx-auto px-4 mb-14">
        <div className="reveal text-center max-w-xl mx-auto">
          <h2 className="font-erstoria text-[clamp(2rem,4.5vw,3.25rem)] text-zinc-100 leading-[1.1] tracking-[-0.02em] mb-4">
            Historias de{" "}
            <span className="gradient-text-hero">transformación</span>
          </h2>
          <p className="font-karla text-sm text-zinc-600 mt-2">
            Testimonios ilustrativos de nuestra comunidad
          </p>
        </div>
      </div>

      {/* Infinite ticker — row 1 (left) */}
      <div className="relative mb-4">
        <div className="flex animate-[ticker_35s_linear_infinite]">
          {doubledTestimonials.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A1A10] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A1A10] to-transparent pointer-events-none z-10" />
      </div>

      {/* Infinite ticker — row 2 (right, reversed) */}
      <div className="relative">
        <div
          className="flex"
          style={{ animation: "ticker 40s linear infinite reverse" }}
        >
          {[...doubledTestimonials].reverse().map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A1A10] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A1A10] to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
};
