import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useCallback } from "react";

const MagneticButton = ({
  children,
  to,
}: {
  children: React.ReactNode;
  to: string;
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
      y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
    },
    [x, y]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <Link to={to}>
      <motion.button
        ref={btnRef}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        whileHover={{
          scale: 1.04,
          boxShadow: "0 12px 48px rgba(18,163,87,0.40)",
        }}
        whileTap={{ scale: 0.97 }}
        className="group relative px-10 py-5 bg-[#12A357] text-white font-karla font-bold text-lg rounded-2xl overflow-hidden cursor-pointer transition-colors hover:bg-[#0F8A4A]"
      >
        <span className="relative z-10">{children}</span>
        {/* Shimmer */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700" />
        {/* Inner glow */}
        <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-white/12 to-transparent" />
      </motion.button>
    </Link>
  );
};

export const CTASection = () => {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Deep forest bg with radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #1F4D2E 0%, #0D1F15 55%, #0A1810 100%)",
        }}
      />

      {/* Warm glow center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none animate-glow-pulse"
        style={{
          background:
            "radial-gradient(ellipse, rgba(18,163,87,0.18) 0%, transparent 65%)",
        }}
      />

      {/* Rose warm accent */}
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(231,131,157,0.06) 0%, transparent 65%)",
        }}
      />

      {/* Gold accent */}
      <div
        className="absolute top-1/2 left-1/4 w-[300px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(245,194,67,0.05) 0%, transparent 65%)",
        }}
      />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12A357]/12 border border-[#12A357]/25 text-[#6FCB9C] text-xs font-karla uppercase tracking-wider mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12A357] animate-pulse" />
            Empieza hoy — sin compromiso
          </div>

          {/* Headline */}
          <h2 className="font-erstoria text-[clamp(2.4rem,6vw,4rem)] text-zinc-100 leading-[1.1] tracking-[-0.025em] mb-6">
            Da el primer paso hoy
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="font-karla italic text-xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed"
          >
            "Miles de personas en México ya reconectaron consigo mismas."
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <MagneticButton to="/therapists">Empezar ahora</MagneticButton>
            <Link
              to="/pricing"
              className="font-karla text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500 cursor-pointer"
            >
              Ver precios y planes
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="font-karla text-xs text-[#3A6A4C] mt-10"
          >
            Sin tarjeta · Cancela cuando quieras · Hecho con 💚 en México
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
