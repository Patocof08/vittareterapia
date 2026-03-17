import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Video } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MessageCircle,
    title: "Cuéntanos cómo te sientes",
    description:
      "Completa un breve cuestionario de bienestar. Sin diagnósticos, solo para conocerte mejor y encontrar al profesional ideal para ti.",
    accent: "#E7839D",
    bg: "#F5C7D1",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Te conectamos con el psicólogo ideal",
    description:
      "Nuestro algoritmo de emparejamiento analiza tu perfil, necesidades y disponibilidad para sugerirte los mejores profesionales.",
    accent: "#12A357",
    bg: "#BFE9E2",
  },
  {
    num: "03",
    icon: Video,
    title: "Empieza tu primera sesión",
    description:
      "Conéctate por video desde cualquier dispositivo. Sin descargas. Factura CFDI incluida. Tu proceso terapéutico empieza hoy.",
    accent: "#7FCFC2",
    bg: "#BFE9E2",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const HowItWorksSection = () => {
  return (
    <section
      id="como-funciona"
      className="bg-[#FAFAF8] py-20 md:py-28 relative overflow-hidden"
    >
      {/* Big decorative numbers background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-8 right-4 font-erstoria text-[220px] text-[#1F4D2E]/[0.025] leading-none select-none">
          03
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12A357]/10 text-[#12A357] text-xs font-karla uppercase tracking-wide mb-5">
            Proceso
          </div>
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em]">
            Tres pasos hacia
            <br />
            <span className="text-[#12A357]">tu bienestar</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="space-y-5"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              variants={stepVariants}
              className="group flex gap-6 md:gap-10 items-start p-6 md:p-8 bg-white rounded-3xl border border-[#1F4D2E]/6 hover:border-[#12A357]/20 transition-all duration-300 cursor-default"
              style={{ boxShadow: "0 2px 12px rgba(31,77,46,0.05)" }}
              whileHover={{
                y: -3,
                boxShadow: "0 12px 32px rgba(31,77,46,0.10)",
                transition: { type: "spring", stiffness: 300 },
              }}
            >
              {/* Big number */}
              <div className="flex-shrink-0 hidden md:block">
                <span
                  className="font-erstoria text-7xl leading-none opacity-[0.12] select-none"
                  style={{ color: step.accent }}
                >
                  {step.num}
                </span>
              </div>

              {/* Icon */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center mt-1 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${step.accent}18` }}
              >
                <step.icon className="w-6 h-6" style={{ color: step.accent }} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div
                  className="font-karla text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: `${step.accent}90` }}
                >
                  Paso {step.num}
                </div>
                <h3 className="font-karla font-bold text-xl text-[#1F4D2E] mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="font-karla text-[#6D8F7A] text-base leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex-shrink-0 hidden lg:flex items-center">
                {i < steps.length - 1 ? (
                  <div className="flex flex-col items-center gap-1">
                    {[...Array(4)].map((_, j) => (
                      <div
                        key={j}
                        className="w-1 h-1 rounded-full opacity-30"
                        style={{ background: step.accent }}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-karla font-bold"
                    style={{ background: step.accent }}
                  >
                    ✓
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
