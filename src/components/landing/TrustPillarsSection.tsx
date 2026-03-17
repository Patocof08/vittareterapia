import { motion } from "framer-motion";
import { Heart, ShieldCheck, Banknote } from "lucide-react";

const pillars = [
  {
    key: "HUMANO",
    icon: Heart,
    color: "#E7839D",
    bg: "#F5C7D1",
    title: "Humano",
    description:
      "Cada psicólogo es una persona real, con formación y vocación. La relación terapéutica está en el centro de todo.",
  },
  {
    key: "CONFIABLE",
    icon: ShieldCheck,
    color: "#12A357",
    bg: "#BFE9E2",
    title: "Confiable",
    description:
      "Verificamos cédula profesional y documentos antes de aprobar cada perfil. Tu seguridad no es opcional.",
  },
  {
    key: "ACCESIBLE",
    icon: Banknote,
    color: "#7FCFC2",
    bg: "#BFE9E2",
    title: "Accesible",
    description:
      "Precios transparentes, facturación CFDI y opciones para todos los presupuestos. Sin letras pequeñas.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const TrustPillarsSection = () => {
  return (
    <section className="bg-white py-20 md:py-28 relative overflow-hidden">
      {/* Subtle divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#12A357]/15 to-transparent" />

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 max-w-xl mx-auto"
        >
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em] mb-4">
            Tres principios que nos guían
          </h2>
          <p className="font-karla text-base text-[#6D8F7A] leading-relaxed">
            Vittare nació para hacer la terapia accesible, sin perder la
            calidad ni la calidez que merece cada persona.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.key}
              variants={cardVariants}
              whileHover={{
                y: -8,
                boxShadow: `0 20px 48px ${pillar.color}28`,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              className="group relative bg-white rounded-3xl p-8 border border-[#1F4D2E]/8 cursor-default overflow-hidden"
              style={{ boxShadow: "0 2px 16px rgba(31,77,46,0.06)" }}
            >
              {/* Background wash on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                style={{
                  background: `radial-gradient(circle at 20% 20%, ${pillar.color}10, transparent 70%)`,
                }}
              />

              {/* Icon */}
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${pillar.color}18` }}
              >
                <pillar.icon
                  className="w-6 h-6"
                  style={{ color: pillar.color }}
                />
              </div>

              {/* Key word pill */}
              <div
                className="inline-block font-karla text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-4"
                style={{
                  background: `${pillar.color}15`,
                  color: pillar.color,
                }}
              >
                {pillar.key}
              </div>

              <h3 className="font-karla font-bold text-xl text-[#1F4D2E] mb-3">
                {pillar.title}
              </h3>
              <p className="font-karla text-[#6D8F7A] text-sm leading-relaxed">
                {pillar.description}
              </p>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${pillar.color}60, transparent)`,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
