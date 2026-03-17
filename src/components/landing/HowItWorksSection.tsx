import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Video } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MessageCircle,
    title: "Cuéntanos cómo te sientes",
    description:
      "Completa un breve cuestionario de bienestar. Sin diagnósticos, solo para conocerte mejor y encontrar al profesional ideal para ti.",
    color: "#D16484",
    colorLight: "#E7839D",
    bg: "#F5C7D1",
    bgLight: "#FDF0F3",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Te conectamos con el psicólogo ideal",
    description:
      "Nuestro sistema analiza tu perfil, necesidades y disponibilidad para sugerirte los mejores profesionales verificados.",
    color: "#6AB7AB",
    colorLight: "#7FCFC2",
    bg: "#BFE9E2",
    bgLight: "#F0FAF8",
  },
  {
    num: "03",
    icon: Video,
    title: "Empieza tu primera sesión",
    description:
      "Conéctate por video desde cualquier dispositivo. Sin descargas. Factura CFDI incluida. Tu proceso terapéutico empieza hoy.",
    color: "#D9A932",
    colorLight: "#F5C243",
    bg: "#F6E4B2",
    bgLight: "#FFFBEF",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const stepVariants = {
  hidden: { opacity: 0, x: -24 },
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
      className="py-20 md:py-28 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F0FAF8 30%, #FFFBEF 70%, #FAFAF8 100%)",
      }}
    >
      {/* Decorative big number */}
      <div className="absolute top-8 right-4 font-erstoria text-[200px] leading-none select-none pointer-events-none"
        style={{ color: "#BFE9E2", opacity: 0.4 }}>
        03
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
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
            style={{ background: "#BFE9E2", color: "#6AB7AB" }}
          >
            Proceso
          </div>
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em]">
            Tres pasos hacia
            <br />
            <span style={{ color: "#6AB7AB" }}>tu bienestar</span>
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
              whileHover={{
                y: -3,
                boxShadow: `0 12px 32px ${step.color}18`,
                transition: { type: "spring", stiffness: 300 },
              }}
              className="group flex gap-6 md:gap-10 items-start p-6 md:p-8 bg-white rounded-3xl border cursor-default transition-all duration-300"
              style={{
                borderColor: `${step.bg}`,
                boxShadow: `0 2px 12px ${step.color}0A`,
              }}
            >
              {/* Big number */}
              <div className="flex-shrink-0 hidden md:block">
                <span
                  className="font-erstoria text-7xl leading-none select-none"
                  style={{ color: step.bg, opacity: 0.9 }}
                >
                  {step.num}
                </span>
              </div>

              {/* Icon */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center mt-1 transition-transform duration-300 group-hover:scale-110"
                style={{ background: step.bg }}
              >
                <step.icon className="w-6 h-6" style={{ color: step.color }} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div
                  className="font-karla text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: step.colorLight }}
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

              {/* Right indicator */}
              {i < steps.length - 1 ? (
                <div className="hidden lg:flex flex-col items-center gap-1 self-center flex-shrink-0">
                  {[...Array(4)].map((_, j) => (
                    <div
                      key={j}
                      className="w-1 h-1 rounded-full"
                      style={{ background: step.bg }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="hidden lg:flex w-8 h-8 rounded-full items-center justify-center text-white text-sm font-karla font-bold self-center flex-shrink-0"
                  style={{ background: step.color }}
                >
                  ✓
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
