import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, Lightbulb, Globe } from "lucide-react";
import { motion } from "framer-motion";

const philosophyItems = [
  {
    icon: Heart,
    color: "#D16484",
    bg: "#F5C7D1",
    title: "Transformamos",
    text: "Las barreras que rodean la salud mental en puentes que conectan a las personas con el apoyo que necesitan.",
  },
  {
    icon: Lightbulb,
    color: "#12A357",
    bg: "#D4F0E2",
    title: "Hacemos",
    text: "De la terapia una experiencia accesible, humana y libre de juicios — donde cada persona se sienta escuchada.",
  },
  {
    icon: Globe,
    color: "#6AB7AB",
    bg: "#BFE9E2",
    title: "Creemos",
    text: "Que pedir ayuda es un acto de valentía, no de debilidad, y que todos merecen un espacio seguro para reconectar consigo mismos.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 }
  }),
};

const About = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative py-24 md:py-32 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #F0FAF8 0%, #E8F7F3 40%, #FAFAF8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-25"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] opacity-15"
            style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
          <div className="absolute top-1/2 right-1/3 w-[250px] h-[250px] opacity-10"
            style={{ background: "radial-gradient(circle, #F5C7D1 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-6"
              style={{ background: "#BFE9E2", color: "#12A357" }}
            >
              Acerca de Vittare
            </div>
            <h1 className="font-erstoria text-[clamp(2.2rem,5.5vw,4rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.03em] mb-6 max-w-3xl mx-auto">
              Nos apasiona hacer la salud mental accesible para todos
            </h1>
            <p className="font-karla italic text-xl text-[#6D8F7A] max-w-xl mx-auto">
              "Un espacio seguro para reconectar contigo."
            </p>
          </motion.div>
        </div>
      </section>

      {/* Texto narrativo */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-block font-karla text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
                style={{ background: "#D4F0E2", color: "#12A357" }}
              >
                Quiénes somos
              </div>
              <div className="space-y-5 font-karla text-lg text-[#3A6A4C] leading-relaxed">
                <p>
                  En México, millones de personas viven con ansiedad, estrés y presión constante,
                  pero siguen encontrando barreras para pedir ayuda: miedo al qué dirán, procesos
                  complicados, falta de información y una experiencia que se siente lejana e impersonal.
                </p>
                <p>
                  En Vittare creemos que cuidar tu salud mental no debería ser complicado ni estar
                  lleno de estigmas. Somos un equipo dedicado a transformar la forma en que las
                  personas acceden a terapia psicológica: con psicólogos verificados, procesos claros,
                  y una experiencia diseñada para sentirse segura, cercana y humana.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Imagen */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=1400&auto=format&fit=crop"
              alt="Personas conectando en un espacio seguro"
              className="w-full h-[400px] md:h-[500px] object-cover rounded-3xl"
              style={{ boxShadow: "0 16px 64px rgba(18,163,87,0.10)" }}
            />
          </div>
        </div>
      </section>

      {/* Filosofía */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #F0FAF8 0%, #FAFAF8 100%)" }}>
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em]">
              Nuestra Filosofía
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {philosophyItems.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: `0 16px 40px ${item.color}20`, transition: { type: "spring", stiffness: 300 } }}
                className="bg-white rounded-3xl p-7 border cursor-default"
                style={{ borderColor: `${item.bg}80`, boxShadow: `0 2px 16px ${item.color}10` }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: item.bg }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="font-karla font-bold text-lg text-[#1F4D2E] mb-2">{item.title}</h3>
                <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dos imágenes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <img
              src="https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?q=80&w=800&auto=format&fit=crop"
              alt="Bienestar y crecimiento personal"
              className="w-full h-[300px] object-cover rounded-3xl"
            />
            <img
              src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=800&auto=format&fit=crop"
              alt="Espacio de trabajo colaborativo"
              className="w-full h-[300px] object-cover rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* Visión */}
      <section className="py-20" style={{ background: "#F0FAF8" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-block font-karla text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
                style={{ background: "#BFE9E2", color: "#6AB7AB" }}
              >
                Nuestra Visión
              </div>
              <div className="space-y-5 font-karla text-lg text-[#3A6A4C] leading-relaxed">
                <p>
                  Soñamos con un futuro en el que cuidar tu salud mental sea tan natural como
                  cuidar tu salud física. Donde nadie tenga que pensarlo dos veces antes de
                  buscar apoyo, y donde encontrar al psicólogo indicado sea simple, seguro y
                  sin complicaciones.
                </p>
                <p>
                  Queremos que Vittare sea ese espacio que faltaba: una plataforma que se
                  adapta a ti, no al revés. Donde los psicólogos están verificados, los
                  precios son transparentes y la experiencia se siente cercana desde el
                  primer clic.
                </p>
                <p>
                  En Vittare creemos que ese futuro no es lejano — es el que estamos construyendo hoy.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-block font-karla text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
                style={{ background: "#D4F0E2", color: "#12A357" }}
              >
                Nuestra Historia
              </div>
              <div className="space-y-5 font-karla text-lg text-[#3A6A4C] leading-relaxed">
                <p>
                  Vittare nació de la necesidad de hacer la terapia psicológica más accesible,
                  más humana y libre de estigmas en México.
                </p>
                <p>
                  La motivación surgió al ver una realidad que se repite todos los días:
                  personas que necesitan apoyo pero no saben por dónde empezar, procesos
                  que se sienten fríos y distantes, y una cultura que todavía le tiene miedo
                  a hablar de salud mental.
                </p>
                <p>
                  Hoy seguimos creciendo con esa misma convicción — demostrando que la
                  terapia puede ser simple, personalizada y accesible para todos.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ¿Qué significa Vittare? */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #E8F7F3 0%, #F0FAF8 100%)" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em] mb-5">
                ¿Qué significa Vittare?
              </h2>
              <p className="font-karla text-[#6D8F7A] text-lg leading-relaxed mb-6">
                Vittare es un nombre que transmite bienestar, crecimiento y reconexión personal.
                Más que describir un servicio, representa la experiencia que queremos construir.
              </p>
              <p
                className="font-erstoria text-2xl"
                style={{ color: "#12A357" }}
              >
                "Un espacio seguro para reconectar contigo."
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] mb-3">
              Quiénes estamos detrás
            </h2>
            <p className="font-karla text-[#6D8F7A] max-w-lg mx-auto">
              Un equipo pequeño con una misión grande: transformar la forma en que México se acerca a la salud mental.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl mx-auto">
            {[
              {
                name: "Patricio Cohen",
                role: "Co-Founder · Estrategia y Desarrollo de Negocio",
                bio: "Encargado de la visión general de Vittare, la construcción del modelo de negocio, el crecimiento del proyecto y las alianzas estratégicas.",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
              },
              {
                name: "Santiago Sales",
                role: "Co-Founder",
                bio: "Socio fundador de Vittare, enfocado en la construcción y consolidación del proyecto desde sus etapas iniciales, aportando a su desarrollo y ejecución.",
                img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
              },
            ].map((person, i) => (
              <motion.div
                key={person.name}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <div
                  className="w-40 h-40 rounded-3xl mx-auto mb-5 overflow-hidden"
                  style={{ border: "2px solid #BFE9E2", boxShadow: "0 4px 24px rgba(18,163,87,0.10)" }}
                >
                  <img src={person.img} alt={person.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-karla font-bold text-xl text-[#1F4D2E] mb-1">{person.name}</h3>
                <p className="font-karla text-sm font-medium mb-3" style={{ color: "#12A357" }}>{person.role}</p>
                <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed">{person.bio}</p>
              </motion.div>
            ))}
          </div>
          <p className="font-karla text-xs text-[#6D8F7A]/60 text-center mt-8">
            Las fotos del equipo son temporales — reemplazar con fotos reales.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #E8F7F0 0%, #D4F0E2 50%, #C8EDD8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-20"
            style={{ background: "radial-gradient(circle, #12A357 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] mb-4">
              Tu bienestar empieza con un paso
            </h2>
            <p className="font-karla text-lg text-[#3A6A4C] mb-10 max-w-xl mx-auto leading-relaxed">
              No tienes que hacerlo solo. Encuentra al psicólogo ideal y comienza desde la comodidad de tu hogar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/therapists">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(18,163,87,0.28)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer"
                >
                  Encontrar mi psicólogo
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link to="/para-psicologos">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 font-karla font-bold rounded-2xl border-2 cursor-pointer"
                  style={{ borderColor: "#12A357", color: "#1F4D2E" }}
                >
                  Soy psicólogo
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

export default About;
