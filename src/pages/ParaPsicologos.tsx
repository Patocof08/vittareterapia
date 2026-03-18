import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, Calendar, CreditCard, Users, Video, Shield, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  { icon: Calendar, title: "Agenda automatizada", description: "Gestiona tu disponibilidad y sesiones sin complicaciones. Los pacientes agendan directamente contigo.", color: "#12A357", bg: "#D4F0E2" },
  { icon: CreditCard, title: "Pagos simplificados", description: "Recibe tus pagos de forma segura y automática. Comisión transparente, sin cargos sorpresa.", color: "#6AB7AB", bg: "#BFE9E2" },
  { icon: Users, title: "Herramientas profesionales", description: "Seguimiento de pacientes, asignación de tareas y expedientes digitales en un solo lugar.", color: "#2FB06B", bg: "#C8EDD8" },
  { icon: Video, title: "Videollamadas seguras", description: "Plataforma integrada para sesiones virtuales con la mejor calidad y privacidad.", color: "#6AB7AB", bg: "#BFE9E2" },
  { icon: Shield, title: "Verificación profesional", description: "Tu perfil verificado genera confianza. Nosotros validamos tu cédula y credenciales.", color: "#12A357", bg: "#D4F0E2" },
  { icon: CheckCircle2, title: "Libertad total", description: "Fija tus horarios, precios y metodología. Tú decides cómo trabajar.", color: "#2FB06B", bg: "#C8EDD8" },
];

const steps = [
  { num: "01", title: "Regístrate", description: "Completa tu perfil profesional con tu experiencia, especialidades y enfoque terapéutico.", color: "#12A357", bg: "#D4F0E2" },
  { num: "02", title: "Configura", description: "Sube tus documentos, define tu disponibilidad y establece tus tarifas.", color: "#6AB7AB", bg: "#BFE9E2" },
  { num: "03", title: "Publica", description: "Una vez verificado, tu perfil estará visible y comenzarás a recibir solicitudes de pacientes.", color: "#2FB06B", bg: "#C8EDD8" },
];

const stats = [
  { value: "500+", label: "Sesiones completadas", color: "#12A357", bg: "#D4F0E2" },
  { value: "4.9★", label: "Calificación promedio", color: "#6AB7AB", bg: "#BFE9E2" },
  { value: "85%", label: "Para el psicólogo", color: "#2FB06B", bg: "#C8EDD8" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.08 }
  }),
};

export default function ParaPsicologos() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleJoinClick = async () => {
    if (user && role === "cliente") {
      toast.error("Ya tienes una sesión activa como paciente", {
        description: "Cierra tu sesión actual para registrarte como psicólogo",
        action: {
          label: "Cerrar sesión",
          onClick: async () => { await signOut(); navigate("/onboarding-psicologo"); }
        },
        duration: 10000
      });
      return;
    }
    if (user && role === "psicologo") { navigate("/therapist/dashboard"); return; }
    navigate("/onboarding-psicologo");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #F0FAF8 0%, #E8F7F3 50%, #FAFAF8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-30"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-15"
            style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-karla uppercase tracking-wider mb-6"
              style={{ background: "#D4F0E2", color: "#12A357", border: "1px solid #BFE9E2" }}
            >
              <Star className="w-3 h-3" />
              Para Psicólogos
            </div>
            <h1 className="font-erstoria text-[clamp(2.4rem,6vw,4.5rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.03em] mb-6 max-w-3xl mx-auto">
              Conecta con pacientes.<br />
              <span style={{ color: "#12A357" }}>Crece con Vittare.</span>
            </h1>
            <p className="font-karla text-lg text-[#6D8F7A] mb-10 max-w-xl mx-auto leading-relaxed">
              La plataforma que facilita tu práctica independiente. Gestiona tu agenda, recibe pagos
              automáticos y mantén todo organizado en un solo lugar.
            </p>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(18,163,87,0.30)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoinClick}
              className="inline-flex items-center gap-2 px-10 py-5 bg-[#12A357] text-white font-karla font-bold text-lg rounded-2xl cursor-pointer"
            >
              Únete al equipo
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 mt-14 pt-10"
            style={{ borderTop: "1px solid #BFE9E2" }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-karla font-bold"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  {stat.value.replace("+", "").replace("★", "").replace("%", "")}
                </div>
                <div>
                  <div className="font-karla font-bold text-sm text-[#1F4D2E]">{stat.value}</div>
                  <div className="font-karla text-xs text-[#6D8F7A]">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div
              className="inline-block font-karla text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: "#D4F0E2", color: "#12A357" }}
            >
              Beneficios
            </div>
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] mb-3">
              ¿Qué ofrece Vittare a los psicólogos?
            </h2>
            <p className="font-karla text-[#6D8F7A] max-w-xl mx-auto leading-relaxed">
              Herramientas diseñadas para que te enfoques en lo que realmente importa: tus pacientes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -5, boxShadow: `0 12px 32px ${b.color}18`, transition: { type: "spring", stiffness: 300 } }}
                className="bg-white rounded-3xl p-7 border cursor-default"
                style={{ borderColor: `${b.bg}80`, boxShadow: `0 2px 12px ${b.color}0A` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: b.bg }}
                >
                  <b.icon className="w-5 h-5" style={{ color: b.color }} />
                </div>
                <h3 className="font-karla font-bold text-base text-[#1F4D2E] mb-2">{b.title}</h3>
                <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #F0FAF8 0%, #E8F7F3 100%)" }}>
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] mb-3">
              Tres pasos para empezar
            </h2>
            <p className="font-karla text-[#6D8F7A] max-w-lg mx-auto">
              Únete a nuestra comunidad de profesionales y comienza a construir tu práctica independiente.
            </p>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -3, transition: { type: "spring", stiffness: 300 } }}
                className="flex items-center gap-6 bg-white rounded-3xl p-6 md:p-7 border"
                style={{ borderColor: `${step.bg}`, boxShadow: `0 2px 12px ${step.color}0A` }}
              >
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-erstoria text-3xl leading-none select-none"
                  style={{ background: step.bg, color: step.color }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 className="font-karla font-bold text-lg text-[#1F4D2E] mb-1">{step.title}</h3>
                  <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comunidad */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] mb-3">
                Comunidad Vittare
              </h2>
              <p className="font-karla text-lg text-[#6D8F7A] leading-relaxed">
                No trabajas solo. Formas parte de una comunidad de profesionales que crece junta.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { title: "Soporte técnico", desc: "Equipo disponible para resolver cualquier duda o problema técnico.", color: "#12A357", bg: "#D4F0E2" },
                { title: "Red de profesionales", desc: "Próximamente: conecta con otros terapeutas y comparte experiencias.", color: "#6AB7AB", bg: "#BFE9E2" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-3xl p-6 border"
                  style={{ borderColor: `${item.bg}80`, boxShadow: `0 2px 12px ${item.color}0A` }}
                >
                  <div
                    className="w-2 h-8 rounded-full mb-4"
                    style={{ background: `linear-gradient(180deg, ${item.color}, ${item.bg})` }}
                  />
                  <h3 className="font-karla font-bold text-base text-[#1F4D2E] mb-2">{item.title}</h3>
                  <p className="font-karla text-sm text-[#6D8F7A]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #E8F7F0 0%, #D4F0E2 50%, #C8EDD8 100%)" }}
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #12A357 0%, transparent 65%)" }} />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] mb-4">
              ¿Listo para dar el siguiente paso?
            </h2>
            <p className="font-karla text-lg text-[#3A6A4C] mb-10 max-w-xl mx-auto leading-relaxed">
              Únete a los profesionales que ya confían en Vittare para gestionar su práctica.
            </p>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(18,163,87,0.28)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoinClick}
              className="inline-flex items-center gap-2 px-10 py-5 bg-[#12A357] text-white font-karla font-bold text-lg rounded-2xl cursor-pointer"
            >
              Únete al equipo
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
