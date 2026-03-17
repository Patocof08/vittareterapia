import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sofía R.",
    role: "28 años, CDMX",
    text: "Vittare me ayudó a dar el primer paso sin sentirme juzgada. Mi psicóloga es increíble.",
    rating: 5,
    initials: "SR",
    accent: "#E7839D",
  },
  {
    name: "Miguel A.",
    role: "35 años, Monterrey",
    text: "Nunca imaginé que la terapia online fuera tan efectiva. Llevo 3 meses y los cambios son reales.",
    rating: 5,
    initials: "MA",
    accent: "#12A357",
  },
  {
    name: "Carmen L.",
    role: "42 años, Guadalajara",
    text: "La facturación CFDI fue clave para mí. Y el proceso de encontrar psicólogo fue muy sencillo.",
    rating: 5,
    initials: "CL",
    accent: "#7FCFC2",
  },
  {
    name: "David T.",
    role: "24 años, CDMX",
    text: "Tenía mucho miedo de pedir ayuda. En Vittare encontré un espacio sin juicios y con mucho apoyo.",
    rating: 5,
    initials: "DT",
    accent: "#F5C243",
  },
  {
    name: "Andrea M.",
    role: "31 años, Querétaro",
    text: "Encontré opciones accesibles y de calidad. El acompañamiento desde el inicio fue excepcional.",
    rating: 5,
    initials: "AM",
    accent: "#E7839D",
  },
  {
    name: "Roberto C.",
    role: "47 años, CDMX",
    text: "En días pude tener mi primera cita. El equipo de soporte siempre estuvo atento.",
    rating: 5,
    initials: "RC",
    accent: "#12A357",
  },
];

const doubled = [...testimonials, ...testimonials];

const InfiniteScroller = ({
  items,
  speed = 40,
  reverse = false,
}: {
  items: typeof testimonials;
  speed?: number;
  reverse?: boolean;
}) => {
  const [paused, setPaused] = useState(false);
  const x = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    if (paused) return;
    const el = ref.current;
    if (!el) return;
    const halfWidth = el.scrollWidth / 2;
    const dir = reverse ? 1 : -1;
    const next = x.get() + dir * (delta / 1000) * speed;
    if (!reverse && next < -halfWidth) x.set(next + halfWidth);
    else if (reverse && next > 0) x.set(next - halfWidth);
    else x.set(next);
  });

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div ref={ref} style={{ x }} className="flex gap-4">
        {[...items, ...items].map((t, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[300px] md:w-[320px] bg-[#0D1F15]/70 rounded-3xl p-6 border border-white/8 backdrop-blur-sm"
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-3.5 h-3.5 text-[#F5C243] fill-[#F5C243]" />
              ))}
            </div>

            <p className="font-karla italic text-zinc-300 text-sm leading-relaxed mb-5">
              "{t.text}"
            </p>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-karla font-bold flex-shrink-0"
                style={{
                  background: `${t.accent}25`,
                  color: t.accent,
                  border: `1px solid ${t.accent}40`,
                }}
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
        ))}
      </motion.div>
    </div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section className="bg-[#0D1F15] py-20 md:py-28 overflow-hidden relative">
      {/* Warm glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(18,163,87,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 mb-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-zinc-100 leading-[1.15] tracking-[-0.02em] mb-4">
            Historias de{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7FCFC2, #12A357)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              transformación
            </span>
          </h2>
          <p className="font-karla italic text-zinc-400 text-lg">
            "Miles de personas en México ya reconectaron consigo mismas."
          </p>
          <p className="font-karla text-xs text-zinc-600 mt-2">
            Testimonios ilustrativos de nuestra comunidad
          </p>
        </motion.div>
      </div>

      {/* Scrollers */}
      <div className="space-y-4 relative z-10">
        <InfiniteScroller items={doubled} speed={38} />
        <InfiniteScroller items={[...doubled].reverse()} speed={32} reverse />
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/20 to-transparent" />
    </section>
  );
};
