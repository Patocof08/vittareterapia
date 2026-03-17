import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    id: "single",
    name: "Sesión Única",
    priceMXN: 650,
    priceUSD: 35,
    period: "por sesión",
    description: "Ideal para empezar o retomar tu proceso sin compromiso.",
    features: [
      "1 sesión de 50 minutos",
      "Video llamada segura",
      "Factura CFDI incluida",
      "Notas de sesión",
    ],
    cta: "Reservar sesión",
    accent: "#7FCFC2",
    featured: false,
  },
  {
    id: "monthly",
    name: "Plan Mensual",
    priceMXN: 2200,
    priceUSD: 119,
    period: "4 sesiones / mes",
    description: "El camino más efectivo. Continuidad y progreso real.",
    features: [
      "4 sesiones de 50 min",
      "Ahorra 15% vs. sueltas",
      "Psicólogo dedicado",
      "Notas y tareas entre sesiones",
      "Factura CFDI incluida",
      "Reagenda sin costo",
    ],
    cta: "Comenzar ahora",
    accent: "#12A357",
    featured: true,
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

export const PricingSection = () => {
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");

  return (
    <section className="bg-white py-20 md:py-28 relative overflow-hidden">
      {/* Subtle bg */}
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle, #BFE9E2 0%, transparent 65%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-xl mx-auto"
        >
          <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.75rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em] mb-4">
            Precios claros,
            <br />
            <span className="text-[#12A357]">sin sorpresas</span>
          </h2>
          <p className="font-karla text-base text-[#6D8F7A] leading-relaxed mb-8">
            Elige el plan que mejor se adapte a tu momento. Puedes cambiar cuando quieras.
          </p>

          {/* Currency toggle */}
          <div className="inline-flex items-center bg-[#FAFAF8] rounded-xl p-1 border border-[#1F4D2E]/10">
            {(["MXN", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-5 py-2 rounded-lg font-karla text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  currency === c
                    ? "bg-[#12A357] text-white shadow-sm"
                    : "text-[#6D8F7A] hover:text-[#1F4D2E]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              whileHover={{
                y: plan.featured ? -6 : -4,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              className="relative"
            >
              {/* Featured gradient border */}
              {plan.featured && (
                <div
                  className="absolute -inset-[1px] rounded-[28px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #12A357, #7FCFC2, #12A357)",
                    backgroundSize: "200% 200%",
                    animation: "gradient-shift 4s ease infinite",
                  }}
                />
              )}

              <div
                className={`relative rounded-3xl p-7 overflow-hidden ${
                  plan.featured ? "bg-white" : "bg-white border border-[#1F4D2E]/8"
                }`}
                style={
                  plan.featured
                    ? { boxShadow: "0 8px 32px rgba(18,163,87,0.15)" }
                    : { boxShadow: "0 2px 16px rgba(31,77,46,0.05)" }
                }
              >
                {plan.featured && (
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-3.5 h-3.5 text-[#12A357]" />
                    <span className="font-karla text-xs font-bold uppercase tracking-wide text-[#12A357]">
                      Más popular
                    </span>
                  </div>
                )}

                <h3 className="font-karla font-bold text-xl text-[#1F4D2E] mb-1">
                  {plan.name}
                </h3>
                <p className="font-karla text-sm text-[#6D8F7A] mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-karla font-bold text-4xl text-[#1F4D2E]">
                    {currency === "MXN"
                      ? `$${plan.priceMXN.toLocaleString("es-MX")}`
                      : `$${plan.priceUSD}`}
                  </span>
                  <span className="font-karla text-sm text-[#6D8F7A]">
                    {currency} · {plan.period}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${plan.accent}20` }}
                      >
                        <Check
                          className="w-3 h-3"
                          style={{ color: plan.accent }}
                          strokeWidth={2.5}
                        />
                      </div>
                      <span className="font-karla text-sm text-[#3A6A4C]">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/therapists">
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: plan.featured
                        ? "0 6px 24px rgba(18,163,87,0.30)"
                        : "0 4px 16px rgba(31,77,46,0.15)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3.5 rounded-2xl font-karla font-bold text-sm transition-colors cursor-pointer ${
                      plan.featured
                        ? "bg-[#12A357] text-white hover:bg-[#0F8A4A]"
                        : "bg-[#FAFAF8] text-[#1F4D2E] border border-[#1F4D2E]/15 hover:bg-[#F0F7F3]"
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center font-karla text-xs text-[#6D8F7A] mt-8"
        >
          Sin tarjeta de crédito requerida · Cancela cuando quieras ·{" "}
          <Link
            to="/pricing"
            className="text-[#12A357] underline underline-offset-2 hover:text-[#0F8A4A]"
          >
            Ver todos los planes
          </Link>
        </motion.p>
      </div>
    </section>
  );
};
