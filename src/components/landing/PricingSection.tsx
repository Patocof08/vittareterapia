import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, TrendingUp, Package, Users } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.10 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const PricingSection = () => {
  return (
    <section
      className="py-20 md:py-28 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FAFAF8 0%, #F0FAF8 40%, #E8F7F3 80%, #FAFAF8 100%)",
      }}
    >
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 max-w-xl mx-auto"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
            style={{ background: "#D4F0E2", color: "#12A357" }}
          >
            Precios
          </div>
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em] mb-4">
            Precios claros,
            <br />
            <span style={{ color: "#12A357" }}>sin sorpresas</span>
          </h2>
          <p className="font-karla text-base text-[#6D8F7A] leading-relaxed">
            Paga por sesión o ahorra con un paquete mensual. El precio lo fija tu terapeuta.
          </p>
        </motion.div>

        {/* Cards — 3 columnas en desktop */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto"
        >
          {/* Sesión Individual */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="relative"
          >
            <div
              className="bg-white rounded-3xl p-7 border h-full flex flex-col"
              style={{ borderColor: "#BFE9E2", boxShadow: "0 2px 16px rgba(18,163,87,0.07)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-20 rounded-t-3xl opacity-25"
                style={{ background: "linear-gradient(180deg, #BFE9E2 0%, transparent 100%)" }}
              />
              <div className="relative z-10 flex flex-col flex-1">
                <div
                  className="inline-block font-karla text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-4 self-start"
                  style={{ background: "#D4F0E2", color: "#12A357" }}
                >
                  Sin compromiso
                </div>

                <h3 className="font-karla font-bold text-lg text-[#1F4D2E] mb-1">Sesión Individual</h3>
                <p className="font-karla text-xs text-[#6D8F7A] mb-5 leading-relaxed">
                  Ideal para empezar o retomar tu proceso.
                </p>

                {/* Precio */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-karla font-bold text-3xl" style={{ color: "#6AB7AB" }}>Desde $500</span>
                    <span className="font-karla text-sm text-[#6D8F7A]">MXN</span>
                  </div>
                  <p className="font-karla text-[11px] text-[#6D8F7A] mt-1 italic">
                    El precio varía según el terapeuta
                  </p>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {[
                    "1 sesión de 50 minutos",
                    "Videollamada segura",
                    "Factura CFDI incluida",
                    "Notas de sesión",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D4F0E2" }}>
                        <Check className="w-2.5 h-2.5" style={{ color: "#6AB7AB" }} strokeWidth={2.5} />
                      </div>
                      <span className="font-karla text-xs text-[#3A6A4C]">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/therapists">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-2xl font-karla font-bold text-sm cursor-pointer"
                    style={{ background: "#BFE9E2", color: "#6AB7AB" }}
                  >
                    Reservar sesión
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Paquete 4 sesiones */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="relative"
          >
            <div
              className="bg-white rounded-3xl p-7 border h-full flex flex-col"
              style={{ borderColor: "#C8EDD8", boxShadow: "0 2px 16px rgba(18,163,87,0.07)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-20 rounded-t-3xl opacity-25"
                style={{ background: "linear-gradient(180deg, #C8EDD8 0%, transparent 100%)" }}
              />
              <div className="relative z-10 flex flex-col flex-1">
                <div
                  className="inline-block font-karla text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-4 self-start"
                  style={{ background: "#C8EDD8", color: "#2FB06B" }}
                >
                  Paquete básico
                </div>

                <h3 className="font-karla font-bold text-lg text-[#1F4D2E] mb-1">4 Sesiones / Mes</h3>
                <p className="font-karla text-xs text-[#6D8F7A] mb-5 leading-relaxed">
                  Continuidad y progreso real a mejor precio.
                </p>

                {/* Precio */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-karla font-bold text-3xl" style={{ color: "#2FB06B" }}>10% OFF</span>
                  </div>
                  <p className="font-karla text-[11px] text-[#6D8F7A] mt-1 italic">
                    Sobre el precio de cada sesión
                  </p>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {[
                    { icon: Check, text: "4 sesiones de 50 min" },
                    { icon: TrendingUp, text: "Rollover del 25% al mes siguiente" },
                    { icon: Package, text: "Renovación automática" },
                    { icon: Users, text: "Psicólogo dedicado" },
                  ].map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C8EDD8" }}>
                        <f.icon className="w-2.5 h-2.5" style={{ color: "#2FB06B" }} strokeWidth={2.5} />
                      </div>
                      <span className="font-karla text-xs text-[#3A6A4C]">{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/therapists">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-2xl font-karla font-bold text-sm cursor-pointer"
                    style={{ background: "#C8EDD8", color: "#2FB06B" }}
                  >
                    Elegir terapeuta
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Paquete 8 sesiones — featured */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="relative"
          >
            {/* Borde animado */}
            <div
              className="absolute -inset-[1.5px] rounded-[26px]"
              style={{
                background: "linear-gradient(135deg, #BFE9E2, #12A357, #6FCB9C, #BFE9E2)",
                backgroundSize: "200% 200%",
                animation: "gradient-shift 4s ease infinite",
              }}
            />
            <div
              className="relative bg-white rounded-3xl p-7 h-full flex flex-col"
              style={{ boxShadow: "0 8px 40px rgba(18,163,87,0.15)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-20 rounded-t-3xl opacity-30"
                style={{ background: "linear-gradient(180deg, #D4F0E2 0%, transparent 100%)" }}
              />
              <div className="relative z-10 flex flex-col flex-1">
                <div
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-karla font-bold uppercase tracking-wide mb-4 self-start"
                  style={{ background: "#D4F0E2", color: "#12A357" }}
                >
                  ✦ Más popular
                </div>

                <h3 className="font-karla font-bold text-lg text-[#1F4D2E] mb-1">8 Sesiones / Mes</h3>
                <p className="font-karla text-xs text-[#6D8F7A] mb-5 leading-relaxed">
                  El mayor ahorro. Transformación profunda.
                </p>

                {/* Precio */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="font-karla font-bold text-3xl" style={{ color: "#12A357" }}>20% OFF</span>
                  </div>
                  <p className="font-karla text-[11px] text-[#6D8F7A] mt-1 italic">
                    Sobre el precio de cada sesión
                  </p>
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {[
                    { icon: Check, text: "8 sesiones de 50 min" },
                    { icon: TrendingUp, text: "Rollover del 25% al mes siguiente" },
                    { icon: Package, text: "Renovación automática" },
                    { icon: Users, text: "Mayor continuidad terapéutica" },
                    { icon: Check, text: "Factura CFDI incluida" },
                  ].map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D4F0E2" }}>
                        <f.icon className="w-2.5 h-2.5" style={{ color: "#12A357" }} strokeWidth={2.5} />
                      </div>
                      <span className="font-karla text-xs text-[#3A6A4C]">{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/therapists">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-2xl font-karla font-bold text-sm cursor-pointer"
                    style={{ background: "#12A357", color: "white" }}
                  >
                    Comenzar ahora
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Nota pie */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 space-y-1"
        >
          <p className="font-karla text-xs text-[#6D8F7A]">
            Precios desde $500 MXN por sesión · Cada terapeuta fija su tarifa
          </p>
          <p className="font-karla text-xs text-[#6D8F7A]">
            Sin tarjeta de crédito requerida · Cancela cuando quieras ·{" "}
            <Link
              to="/pricing"
              className="underline underline-offset-2 hover:text-[#1F4D2E]"
              style={{ color: "#6AB7AB" }}
            >
              Ver detalles completos
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
