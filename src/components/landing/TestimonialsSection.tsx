import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useRef, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sofía R.",
    role: "28 años, CDMX",
    text: "Vittare me ayudó a dar el primer paso sin sentirme juzgada. Mi psicóloga es increíble.",
    rating: 5,
    initials: "SR",
    accent: "#12A357",
    bg: "#D4F0E2",
  },
  {
    name: "Miguel A.",
    role: "35 años, Monterrey",
    text: "Nunca imaginé que la terapia online fuera tan efectiva. Llevo 3 meses y los cambios son reales.",
    rating: 5,
    initials: "MA",
    accent: "#6AB7AB",
    bg: "#BFE9E2",
  },
  {
    name: "Carmen L.",
    role: "42 años, Guadalajara",
    text: "La facturación CFDI fue clave para mí. Y el proceso de encontrar psicólogo fue muy sencillo.",
    rating: 5,
    initials: "CL",
    accent: "#2FB06B",
    bg: "#C8EDD8",
  },
  {
    name: "David T.",
    role: "24 años, CDMX",
    text: "Tenía mucho miedo de pedir ayuda. En Vittare encontré un espacio sin juicios y con mucho apoyo.",
    rating: 5,
    initials: "DT",
    accent: "#7FCFC2",
    bg: "#BFE9E2",
  },
  {
    name: "Andrea M.",
    role: "31 años, Querétaro",
    text: "Encontré opciones accesibles y de calidad. El acompañamiento desde el inicio fue excepcional.",
    rating: 5,
    initials: "AM",
    accent: "#12A357",
    bg: "#D4F0E2",
  },
  {
    name: "Roberto C.",
    role: "47 años, CDMX",
    text: "En días pude tener mi primera cita. El equipo de soporte siempre estuvo atento.",
    rating: 5,
    initials: "RC",
    accent: "#6AB7AB",
    bg: "#BFE9E2",
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
            className="flex-shrink-0 w-[300px] md:w-[320px] bg-white rounded-3xl p-6 border shadow-sm"
            style={{ borderColor: `${t.accent}25`, boxShadow: `0 2px 16px ${t.accent}0A` }}
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-3.5 h-3.5 text-[#F5C243] fill-[#F5C243]" />
              ))}
            </div>

            {/* Top accent line */}
            <div
              className="w-8 h-0.5 rounded-full mb-3 opacity-60"
              style={{ background: t.accent }}
            />

            <p className="font-karla italic text-[#3A6A4C] text-sm leading-relaxed mb-5">
              "{t.text}"
            </p>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-karla font-bold flex-shrink-0"
                style={{
                  background: t.bg,
                  color: t.accent,
                  border: `1px solid ${t.accent}30`,
                }}
              >
                {t.initials}
              </div>
              <div>
                <div className="font-karla font-bold text-sm text-[#1F4D2E]">
                  {t.name}
                </div>
                <div className="font-karla text-xs text-[#6D8F7A]">{t.role}</div>
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
    <section
      className="py-20 md:py-28 overflow-hidden relative"
      style={{
        background:
          "linear-gradient(180deg, #F0FAF8 0%, #FAFAF8 35%, #FDF0F3 70%, #FFFBEF 100%)",
      }}
    >
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7FCFC2] to-transparent opacity-40" />

      {/* Color blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[400px] h-[350px] opacity-20"
          style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[350px] h-[300px] opacity-15"
          style={{ background: "radial-gradient(circle, #F5C7D1 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] opacity-10"
          style={{ background: "radial-gradient(ellipse, #F6E4B2 0%, transparent 65%)" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 mb-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
            style={{ background: "#BFE9E2", color: "#6AB7AB" }}
          >
            Testimonios
          </div>
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em] mb-4">
            Historias de{" "}
            <span style={{ color: "#6AB7AB" }}>transformación</span>
          </h2>
          <p className="font-karla italic text-[#6D8F7A] text-lg">
            "Miles de personas en México ya reconectaron consigo mismas."
          </p>
          <p className="font-karla text-xs text-[#6D8F7A]/60 mt-2">
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
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#BFE9E2] to-transparent" />
    </section>
  );
};
