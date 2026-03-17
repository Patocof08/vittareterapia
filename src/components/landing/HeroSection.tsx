import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

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

const stats = [
  { value: "500+", label: "Sesiones", color: "#7FCFC2", bg: "#BFE9E2" },
  { value: "4.9★", label: "Calificación", color: "#D9A932", bg: "#F6E4B2" },
  { value: "100%", label: "Verificados", color: "#6FCB9C", bg: "#BFE9E2" },
];

export const HeroSection = () => {
  const words = headline.split(" ");

  return (
    <section className="relative bg-[#FAFAF8] overflow-hidden min-h-[90vh] flex items-center">
      {/* Background color washes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Teal top-right */}
        <div
          className="absolute -top-20 -right-20 w-[550px] h-[550px] opacity-35"
          style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }}
        />
        {/* Rose bottom-left */}
        <div
          className="absolute -bottom-10 -left-10 w-[400px] h-[400px] opacity-25"
          style={{ background: "radial-gradient(circle, #F5C7D1 0%, transparent 65%)" }}
        />
        {/* Gold center hint */}
        <div
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] opacity-15 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, #F6E4B2 0%, transparent 60%)" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 md:py-28">
          {/* Left — copy */}
          <div className="max-w-xl">
            {/* Trust badge — gold */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
              style={{ background: "#F6E4B2", borderColor: "#F5C243", color: "#D9A932" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-karla text-sm font-semibold">
                +500 psicólogos verificados en México
              </span>
            </motion.div>

            {/* Headline */}
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

            <motion.p
              custom={0.6}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-karla text-lg text-[#3A6A4C] leading-relaxed mb-3"
            >
              Psicólogos verificados. Sesiones desde donde estés. Sin estigmas.
            </motion.p>

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
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(18,163,87,0.28)" }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative px-7 py-4 bg-[#12A357] text-white font-karla font-bold text-base rounded-2xl overflow-hidden cursor-pointer transition-colors hover:bg-[#0F8A4A] flex items-center gap-2"
                >
                  Encuentra tu psicólogo
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700" />
                </motion.button>
              </Link>

              <Link to="/#como-funciona">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-4 bg-transparent text-[#1F4D2E] font-karla font-bold text-base rounded-2xl border-2 hover:bg-[#BFE9E2]/30 transition-all duration-300 cursor-pointer"
                  style={{ borderColor: "#7FCFC2" }}
                >
                  ¿Cómo funciona?
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats — cada uno con su color */}
            <motion.div
              custom={1.1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-5 mt-10 pt-8"
              style={{ borderTop: "1px solid #BFE9E2" }}
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-karla font-bold flex-shrink-0"
                    style={{ background: stat.bg, color: stat.color }}
                  >
                    {stat.value.replace("+", "").replace("★", "").replace("%", "")}
                  </div>
                  <div>
                    <div className="font-karla font-bold text-sm text-[#1F4D2E]">
                      {stat.value}
                    </div>
                    <div className="font-karla text-[11px] text-[#6D8F7A]">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — organic blob visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
            className="hidden lg:flex justify-center relative"
          >
            {/* Main organic blob — rosa → teal → gold */}
            <div
              className="relative w-[420px] h-[500px] animate-blob-morph overflow-hidden"
              style={{
                borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
                background: "linear-gradient(145deg, #EDADB2 0%, #F5C7D1 18%, #BFE9E2 40%, #7FCFC2 60%, #F7CF69 82%, #F6E4B2 100%)",
              }}
            >
              {/* Interior botanical */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 400 480" className="w-full h-full opacity-25" fill="none">
                  <path
                    d="M200 460C200 460 80 380 80 260C80 160 130 100 200 100C270 100 320 160 320 260C320 380 200 460 200 460Z"
                    fill="#1F4D2E"
                    opacity="0.5"
                  />
                  <path d="M200 460C200 460 200 280 200 120" stroke="#1F4D2E" strokeWidth="2" opacity="0.4" />
                  {[1, 2, 3, 4].map((i) => (
                    <path
                      key={`l${i}`}
                      d={`M200 ${460 - i * 70}C${200 - i * 30} ${460 - i * 70 - 30} ${200 - i * 50} ${460 - i * 70 - 60} ${200 - i * 60} ${460 - i * 70 - 80}`}
                      stroke="#1F4D2E" strokeWidth="1.5" opacity="0.3"
                    />
                  ))}
                  {[1, 2, 3, 4].map((i) => (
                    <path
                      key={`r${i}`}
                      d={`M200 ${460 - i * 70}C${200 + i * 30} ${460 - i * 70 - 30} ${200 + i * 50} ${460 - i * 70 - 60} ${200 + i * 60} ${460 - i * 70 - 80}`}
                      stroke="#1F4D2E" strokeWidth="1.5" opacity="0.3"
                    />
                  ))}
                </svg>
              </div>
              {/* Color overlays */}
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: "radial-gradient(circle at 75% 75%, #F5C243 0%, transparent 50%)" }}
              />
              <div
                className="absolute inset-0 opacity-15"
                style={{ background: "radial-gradient(circle at 20% 20%, #E7839D 0%, transparent 40%)" }}
              />
            </div>

            {/* Floating badge — rose */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-8 bg-white rounded-2xl px-5 py-4 border"
              style={{
                boxShadow: "0 8px 32px rgba(231,131,157,0.15)",
                borderColor: "#EDADB2",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background: "#F5C7D1" }}
                >
                  ✓
                </div>
                <div>
                  <div className="font-karla font-bold text-sm text-[#1F4D2E]">Psicólogo verificado</div>
                  <div className="font-karla text-xs" style={{ color: "#D16484" }}>Cédula comprobada</div>
                </div>
              </div>
            </motion.div>

            {/* Floating badge — teal */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-8 -right-6 bg-white rounded-2xl px-4 py-3 border"
              style={{
                boxShadow: "0 8px 32px rgba(127,207,194,0.18)",
                borderColor: "#98D9CF",
              }}
            >
              <div className="font-karla text-xs" style={{ color: "#6AB7AB" }}>Próxima cita</div>
              <div className="font-karla font-bold text-sm text-[#1F4D2E] mt-0.5">Hoy · 6:00 PM</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7FCFC2" }} />
                <span className="font-karla text-[10px]" style={{ color: "#6AB7AB" }}>Video sesión activa</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
