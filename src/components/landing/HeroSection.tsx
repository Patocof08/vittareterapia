import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Leaf } from "lucide-react";

const headline = "Un espacio seguro para reconectar contigo";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay },
  }),
};

/* Organic leaf SVG for decorative use */
const LeafDecor = ({
  className,
  color = "#12A357",
  opacity = 0.15,
}: {
  className?: string;
  color?: string;
  opacity?: number;
}) => (
  <svg
    viewBox="0 0 60 80"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M30 75C30 75 5 55 5 30C5 10 15 2 30 2C45 2 55 10 55 30C55 55 30 75 30 75Z"
      fill={color}
      opacity={opacity}
    />
    <path
      d="M30 75C30 75 30 40 30 10"
      stroke={color}
      strokeWidth="1"
      opacity={opacity * 1.5}
    />
    <path
      d="M30 50C20 42 12 32 12 24"
      stroke={color}
      strokeWidth="0.8"
      opacity={opacity}
    />
    <path
      d="M30 50C40 42 48 32 48 24"
      stroke={color}
      strokeWidth="0.8"
      opacity={opacity}
    />
  </svg>
);

export const HeroSection = () => {
  const words = headline.split(" ");

  return (
    <section className="relative bg-[#FAFAF8] overflow-hidden min-h-[90vh] flex items-center">
      {/* Nature texture background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Soft gradient washes */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] opacity-30"
          style={{
            background:
              "radial-gradient(circle, #BFE9E2 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20"
          style={{
            background:
              "radial-gradient(circle, #F5C7D1 0%, transparent 65%)",
          }}
        />

        {/* Decorative leaves */}
        <LeafDecor
          className="absolute top-12 right-[10%] w-32 h-44 animate-leaf-sway"
          color="#12A357"
          opacity={0.12}
        />
        <LeafDecor
          className="absolute top-1/3 right-[5%] w-20 h-28 animate-leaf-sway [animation-delay:1s]"
          color="#7FCFC2"
          opacity={0.15}
        />
        <LeafDecor
          className="absolute bottom-20 right-[18%] w-16 h-22 animate-leaf-sway [animation-delay:2s]"
          color="#6FCB9C"
          opacity={0.1}
        />
        <LeafDecor
          className="absolute top-1/4 left-[3%] w-24 h-32 -rotate-45 animate-leaf-sway [animation-delay:0.5s]"
          color="#12A357"
          opacity={0.08}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 md:py-28">
          {/* Left — copy */}
          <div className="max-w-xl">
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12A357]/10 border border-[#12A357]/20 mb-8"
            >
              <Leaf className="w-3.5 h-3.5 text-[#12A357]" />
              <span className="font-karla text-sm text-[#1F4D2E] font-medium">
                +500 psicólogos verificados en México
              </span>
            </motion.div>

            {/* Headline — word-by-word */}
            <motion.h1
              className="font-erstoria text-[clamp(2.4rem,5.5vw,4rem)] text-[#1F4D2E] leading-[1.12] tracking-[-0.02em] mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className="inline-block mr-[0.28em]"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              custom={0.6}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-karla text-lg text-[#3A6A4C] leading-relaxed mb-3"
            >
              Psicólogos verificados. Sesiones desde donde estés. Sin estigmas.
            </motion.p>

            {/* Italic tagline */}
            <motion.p
              custom={0.75}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-karla italic text-[#6D8F7A] text-base mb-10"
            >
              "Un espacio seguro para reconectar contigo"
            </motion.p>

            {/* CTAs */}
            <motion.div
              custom={0.9}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/therapists">
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 8px 32px rgba(18,163,87,0.30)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative px-7 py-4 bg-[#12A357] text-white font-karla font-bold text-base rounded-2xl overflow-hidden cursor-pointer transition-colors hover:bg-[#0F8A4A] flex items-center gap-2"
                >
                  Encuentra tu psicólogo
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  {/* Shimmer */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700" />
                </motion.button>
              </Link>

              <Link to="/#como-funciona">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-4 bg-transparent text-[#1F4D2E] font-karla font-bold text-base rounded-2xl border-2 border-[#12A357]/40 hover:border-[#12A357] hover:bg-[#12A357]/5 transition-all duration-300 cursor-pointer"
                >
                  ¿Cómo funciona?
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              custom={1.1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-6 mt-10 pt-8 border-t border-[#12A357]/12"
            >
              {[
                { value: "500+", label: "Sesiones" },
                { value: "4.9★", label: "Calificación" },
                { value: "100%", label: "Verificados" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-karla font-bold text-xl text-[#1F4D2E]">
                    {stat.value}
                  </div>
                  <div className="font-karla text-xs text-[#6D8F7A] mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — organic visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
            className="hidden lg:flex justify-center relative"
          >
            {/* Main organic blob */}
            <div
              className="relative w-[420px] h-[500px] animate-blob-morph overflow-hidden"
              style={{
                borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
                background:
                  "linear-gradient(145deg, #BFE9E2 0%, #98D9CF 25%, #7FCFC2 50%, #6FCB9C 75%, #2FB06B 100%)",
              }}
            >
              {/* Interior botanical pattern */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 400 480"
                  className="w-full h-full opacity-30"
                  fill="none"
                >
                  {/* Large leaf center */}
                  <path
                    d="M200 460C200 460 80 380 80 260C80 160 130 100 200 100C270 100 320 160 320 260C320 380 200 460 200 460Z"
                    fill="#1F4D2E"
                    opacity="0.4"
                  />
                  <path
                    d="M200 460C200 460 200 280 200 120"
                    stroke="#1F4D2E"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                  {[1, 2, 3, 4].map((i) => (
                    <path
                      key={i}
                      d={`M200 ${460 - i * 70}C${200 - i * 30} ${460 - i * 70 - 30} ${
                        200 - i * 50
                      } ${460 - i * 70 - 60} ${200 - i * 60} ${460 - i * 70 - 80}`}
                      stroke="#1F4D2E"
                      strokeWidth="1.5"
                      opacity="0.35"
                    />
                  ))}
                  {[1, 2, 3, 4].map((i) => (
                    <path
                      key={i}
                      d={`M200 ${460 - i * 70}C${200 + i * 30} ${460 - i * 70 - 30} ${
                        200 + i * 50
                      } ${460 - i * 70 - 60} ${200 + i * 60} ${460 - i * 70 - 80}`}
                      stroke="#1F4D2E"
                      strokeWidth="1.5"
                      opacity="0.35"
                    />
                  ))}
                </svg>
              </div>

              {/* Warm overlay */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    "radial-gradient(circle at 30% 70%, #F5C243 0%, transparent 50%)",
                }}
              />
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-8 bg-white rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(31,77,46,0.12)] border border-[#12A357]/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#12A357]/15 flex items-center justify-center">
                  <span className="text-lg">✓</span>
                </div>
                <div>
                  <div className="font-karla font-bold text-sm text-[#1F4D2E]">
                    Psicólogo verificado
                  </div>
                  <div className="font-karla text-xs text-[#6D8F7A]">
                    Cédula comprobada
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-8 -right-6 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(31,77,46,0.10)] border border-[#7FCFC2]/20"
            >
              <div className="font-karla text-xs text-[#6D8F7A]">Próxima cita</div>
              <div className="font-karla font-bold text-sm text-[#1F4D2E] mt-0.5">
                Hoy · 6:00 PM
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12A357] animate-pulse" />
                <span className="font-karla text-[10px] text-[#12A357]">
                  Video sesión activa
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
