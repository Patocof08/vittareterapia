import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Check, Info, TrendingUp, Package, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 }
  }),
};

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F0FAF8 0%, #E8F7F3 60%, #FAFAF8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] opacity-25"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] opacity-15"
            style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
              style={{ background: "#D4F0E2", color: "#12A357" }}
            >
              Precios
            </div>
            <h1 className="font-erstoria text-[clamp(2rem,5vw,3.5rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.025em] mb-4">
              Precios transparentes,<br />
              <span style={{ color: "#12A357" }}>sin sorpresas</span>
            </h1>
            <p className="font-karla text-lg text-[#6D8F7A] max-w-xl mx-auto leading-relaxed">
              Paga por sesión individual o ahorra con paquetes mensuales con tu terapeuta
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sesión individual */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] mb-2">Sesión Individual</h2>
              <p className="font-karla text-[#6D8F7A]">Sin compromiso, paga solo por lo que necesitas</p>
            </div>

            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border"
              style={{ borderColor: "#BFE9E2", boxShadow: "0 4px 32px rgba(18,163,87,0.08)" }}
            >
              <div
                className="rounded-2xl p-5 mb-6"
                style={{ background: "linear-gradient(135deg, #D4F0E2 0%, #BFE9E2 100%)" }}
              >
                <p className="font-karla text-xs text-[#3A6A4C] uppercase tracking-wide mb-1">Precio por sesión</p>
                <p className="font-erstoria text-4xl text-[#1F4D2E]">Desde $500 <span className="text-xl">MXN</span></p>
                <p className="font-karla text-sm text-[#6D8F7A] mt-1">El precio varía según el terapeuta que elijas</p>
              </div>

              <ul className="space-y-3 mb-7">
                {[
                  "Sesión de 50 minutos",
                  "Videollamada segura y confidencial",
                  "Facturación disponible (CFDI)",
                  "Sin compromiso a largo plazo",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D4F0E2" }}>
                      <Check className="w-3 h-3" style={{ color: "#12A357" }} strokeWidth={2.5} />
                    </div>
                    <span className="font-karla text-sm text-[#3A6A4C]">{f}</span>
                  </li>
                ))}
              </ul>

              <Link to="/therapists">
                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(18,163,87,0.22)" }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer flex items-center justify-center gap-2"
                >
                  Ver terapeutas disponibles
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Paquetes */}
      <section className="py-16" style={{ background: "#F0FAF8" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] mb-2">Paquetes con Descuento</h2>
            <p className="font-karla text-[#6D8F7A]">Suscripciones mensuales con tu terapeuta favorito</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
            {[
              {
                title: "Paquete Básico",
                badge: "10% OFF",
                sessionCount: "4 sesiones / mes",
                discount: "10% de descuento",
                featured: false,
                color: "#6AB7AB",
                bg: "#BFE9E2",
                features: [
                  { icon: Check, text: "4 sesiones de 50 min al mes" },
                  { icon: TrendingUp, text: "Rollover del 25% (1 sesión al siguiente mes)" },
                  { icon: Package, text: "Renovación automática — cancela cuando quieras" },
                  { icon: Users, text: "Continuidad y progreso real" },
                ],
              },
              {
                title: "Paquete Premium",
                badge: "20% OFF",
                sessionCount: "8 sesiones / mes",
                discount: "20% de descuento",
                featured: true,
                color: "#12A357",
                bg: "#D4F0E2",
                features: [
                  { icon: Check, text: "8 sesiones de 50 min al mes" },
                  { icon: TrendingUp, text: "Rollover del 25% (2 sesiones al siguiente mes)" },
                  { icon: Package, text: "Renovación automática — cancela cuando quieras" },
                  { icon: Users, text: "Mayor continuidad y transformación profunda" },
                ],
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300 } }}
                className="relative"
              >
                {plan.featured && (
                  <div
                    className="absolute -inset-[1.5px] rounded-[26px]"
                    style={{
                      background: "linear-gradient(135deg, #BFE9E2, #12A357, #6FCB9C, #BFE9E2)",
                      backgroundSize: "200% 200%",
                      animation: "gradient-shift 4s ease infinite",
                    }}
                  />
                )}
                <div
                  className="relative bg-white rounded-3xl p-7 border h-full"
                  style={
                    plan.featured
                      ? { boxShadow: "0 8px 40px rgba(18,163,87,0.15)" }
                      : { borderColor: "#BFE9E2", boxShadow: "0 2px 16px rgba(18,163,87,0.07)" }
                  }
                >
                  {/* Top wash */}
                  <div
                    className="absolute top-0 left-0 right-0 h-20 rounded-t-3xl opacity-30"
                    style={{ background: `linear-gradient(180deg, ${plan.bg} 0%, transparent 100%)` }}
                  />

                  <div className="relative z-10">
                    {plan.featured && (
                      <div
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-karla font-bold uppercase tracking-wide mb-3"
                        style={{ background: plan.bg, color: plan.color }}
                      >
                        ✦ Más popular
                      </div>
                    )}

                    <div
                      className="inline-block font-karla text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3"
                      style={{ background: plan.bg, color: plan.color }}
                    >
                      {plan.badge}
                    </div>

                    <h3 className="font-karla font-bold text-xl text-[#1F4D2E] mb-1">{plan.title}</h3>
                    <p className="font-karla text-xs text-[#6D8F7A] mb-5">{plan.sessionCount}</p>

                    <div
                      className="rounded-2xl p-4 mb-6"
                      style={{ background: `${plan.bg}50` }}
                    >
                      <p className="font-karla text-xs text-[#6D8F7A] mb-1">Ahorro mensual</p>
                      <p className="font-erstoria text-2xl" style={{ color: plan.color }}>{plan.discount}</p>
                      <p className="font-karla text-xs text-[#6D8F7A] mt-0.5">sobre el precio del terapeuta</p>
                    </div>

                    <ul className="space-y-3 mb-7">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: plan.bg }}>
                            <f.icon className="w-3 h-3" style={{ color: plan.color }} strokeWidth={2.5} />
                          </div>
                          <span className="font-karla text-sm text-[#3A6A4C]">{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to="/therapists">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3.5 rounded-2xl font-karla font-bold text-sm cursor-pointer"
                        style={
                          plan.featured
                            ? { background: "#12A357", color: "white" }
                            : { background: plan.bg, color: plan.color }
                        }
                      >
                        Elegir terapeuta
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info box */}
          <div
            className="max-w-3xl mx-auto bg-white rounded-3xl p-7 border"
            style={{ borderColor: "#BFE9E2", boxShadow: "0 2px 16px rgba(18,163,87,0.06)" }}
          >
            <h3 className="font-karla font-bold text-sm text-[#1F4D2E] flex items-center gap-2 mb-4">
              <Info className="w-4 h-4" style={{ color: "#6AB7AB" }} />
              Información importante sobre los paquetes
            </h3>
            <div className="space-y-3">
              {[
                { title: "Precios personalizados", text: "Cada terapeuta establece su precio. Los descuentos (10% o 20%) se aplican sobre ese precio base." },
                { title: "Rollover automático", text: "El 25% del total de sesiones del paquete se transfiere al siguiente mes, sin importar cuántas uses." },
                { title: "Suscripción flexible", text: "Los paquetes se renuevan automáticamente cada mes. Puedes cancelar en cualquier momento sin penalización." },
                { title: "Por terapeuta", text: "Las suscripciones son específicas para cada terapeuta. Puedes tener paquetes separados con varios." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A357] flex-shrink-0 mt-2" />
                  <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed">
                    <strong className="text-[#1F4D2E]">{item.title}:</strong> {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ejemplo de precios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] mb-10 text-center">Ejemplo de precios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: "Sesión Individual", badge: null, color: "#6AB7AB", bg: "#BFE9E2", rows: [{ label: "Precio terapeuta", val: "$800" }, { label: "Total por sesión", val: "$800", bold: true }] },
                { title: "Paquete 4 Sesiones", badge: "10% OFF", color: "#12A357", bg: "#D4F0E2", rows: [{ label: "Precio original", val: "$3,200", strike: true }, { label: "Descuento 10%", val: "-$320", green: true }, { label: "Total mensual", val: "$2,880", bold: true }, { label: "Por sesión", val: "$720", small: true }] },
                { title: "Paquete 8 Sesiones", badge: "20% OFF", color: "#12A357", bg: "#D4F0E2", rows: [{ label: "Precio original", val: "$6,400", strike: true }, { label: "Descuento 20%", val: "-$1,280", green: true }, { label: "Total mensual", val: "$5,120", bold: true }, { label: "Por sesión", val: "$640", small: true }] },
              ].map((ex, i) => (
                <motion.div
                  key={ex.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-white rounded-3xl p-6 border"
                  style={{ borderColor: `${ex.bg}80`, boxShadow: `0 2px 16px ${ex.color}0A` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-karla font-bold text-sm text-[#1F4D2E]">{ex.title}</h3>
                    {ex.badge && (
                      <span
                        className="font-karla text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: ex.bg, color: ex.color }}
                      >
                        {ex.badge}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {ex.rows.map((row: any, j) => (
                      <div key={j} className={`flex justify-between items-baseline ${j === ex.rows.length - (ex.rows.find((r: any) => r.small) && !row.small ? 1 : 0) - 1 && !row.small ? "pt-2 border-t border-[#BFE9E2]" : ""}`}>
                        <span className="font-karla text-xs text-[#6D8F7A]">{row.label}:</span>
                        <span className={`font-karla ${row.bold ? "font-bold text-lg text-[#1F4D2E]" : row.green ? "text-[#12A357] font-medium text-sm" : row.strike ? "line-through text-[#6D8F7A] text-sm" : row.small ? "text-xs text-[#6D8F7A]" : "text-sm text-[#1F4D2E]"}`}>
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="font-karla text-center text-xs text-[#6D8F7A] mt-5">
              * Ejemplo basado en un precio de sesión de $800. Los precios reales varían según el terapeuta.
            </p>
          </div>
        </div>
      </section>

      {/* Políticas */}
      <section className="py-16" style={{ background: "#F0FAF8" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] mb-10 text-center">Políticas y condiciones</h2>
            <div className="space-y-4">
              {[
                { title: "Política de cancelación", text: "Puedes cancelar o reprogramar con al menos 24 horas de anticipación sin cargo. Cancelaciones con menos de 24 horas se cobrarán al 100%.", color: "#12A357", bg: "#D4F0E2" },
                { title: "Gestión de suscripciones", text: "Cancela cuando quieras desde tu portal. Al cancelar, seguirás con acceso hasta el final del período. Las sesiones no utilizadas se respetan según el sistema de rollover.", color: "#6AB7AB", bg: "#BFE9E2" },
                { title: "Facturación", text: "Emitimos facturas CFDI para todos los pagos. Solicitala al momento del pago o después desde tu cuenta. Plazo máximo: 72 horas.", color: "#2FB06B", bg: "#C8EDD8" },
                { title: "Métodos de pago", text: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express). Pagos procesados de forma segura a través de Stripe.", color: "#6AB7AB", bg: "#BFE9E2" },
              ].map((policy) => (
                <div
                  key={policy.title}
                  className="bg-white rounded-2xl p-6 border flex items-start gap-4"
                  style={{ borderColor: `${policy.bg}80`, boxShadow: `0 2px 12px ${policy.color}08` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: policy.bg }}
                  >
                    <Info className="w-4 h-4" style={{ color: policy.color }} />
                  </div>
                  <div>
                    <h3 className="font-karla font-bold text-sm text-[#1F4D2E] mb-1">{policy.title}</h3>
                    <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed">{policy.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #E8F7F0 0%, #D4F0E2 50%, #C8EDD8 100%)" }}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] mb-3">¿Tienes dudas sobre los precios?</h2>
            <p className="font-karla text-[#3A6A4C] mb-8 max-w-lg mx-auto">
              Estamos aquí para ayudarte. Contáctanos y resolveremos todas tus preguntas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 bg-white font-karla font-bold rounded-2xl border-2 cursor-pointer"
                  style={{ borderColor: "#BFE9E2", color: "#1F4D2E" }}
                >
                  Contactar
                </motion.button>
              </Link>
              <Link to="/therapists">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(18,163,87,0.25)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer"
                >
                  Ver terapeutas <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Pricing;
