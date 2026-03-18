import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { MessageCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "¿Cómo funciona la terapia en línea?",
    answer: "La terapia en línea funciona igual que la terapia presencial, pero a través de videollamada. Agendas tu sesión, te conectas desde la comodidad de tu hogar y hablas con tu terapeuta en tiempo real. Es seguro, privado y efectivo.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express). Todos los pagos son procesados de forma segura a través de Stripe.",
  },
  {
    question: "¿Puedo cambiar de terapeuta?",
    answer: "Sí, puedes cambiar de terapeuta en cualquier momento sin costo adicional. Sabemos que encontrar la conexión adecuada es importante para el éxito de la terapia.",
  },
  {
    question: "¿Qué pasa si necesito cancelar una sesión?",
    answer: "Puedes cancelar o reprogramar tu sesión con al menos 24 horas de anticipación sin cargo. Cancelaciones con menos de 24 horas se cobrarán en su totalidad (100% del valor de la sesión).",
  },
  {
    question: "¿Es confidencial la terapia en línea?",
    answer: "Absolutamente. Todas las sesiones están protegidas por el secreto profesional y utilizamos plataformas seguras con conexiones cifradas. Tu privacidad es nuestra prioridad.",
  },
  {
    question: "¿Emiten facturas?",
    answer: "Sí, emitimos facturas fiscales (CFDI) para todos los servicios. Puedes solicitarla al momento del pago o después a través de tu cuenta.",
  },
  {
    question: "¿Qué hago en caso de emergencia?",
    answer: "Si estás experimentando una emergencia de salud mental, por favor contacta a los servicios de emergencia locales o llama a la Línea de la Vida: 800 911 2000. La terapia en línea no está diseñada para situaciones de crisis inmediatas.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F0FAF8 0%, #E8F7F3 60%, #FAFAF8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-25"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-20"
            style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
              style={{ background: "#BFE9E2", color: "#12A357" }}
            >
              Ayuda
            </div>
            <h1 className="font-erstoria text-[clamp(2rem,5vw,3.5rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.025em] mb-4">
              Preguntas frecuentes
            </h1>
            <p className="font-karla text-lg text-[#6D8F7A] max-w-xl mx-auto leading-relaxed">
              Encuentra respuestas a las preguntas más comunes sobre nuestros servicios
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 md:py-20 flex-1">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-white rounded-2xl border px-6 overflow-hidden"
                    style={{ borderColor: "#BFE9E2", boxShadow: "0 2px 12px rgba(18,163,87,0.06)" }}
                  >
                    <AccordionTrigger className="font-karla font-semibold text-[#1F4D2E] text-left hover:text-[#12A357] transition-colors py-5 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-karla text-[#6D8F7A] pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emergency */}
      <section className="py-16" style={{ background: "#FDF0F3", borderTop: "1px solid #EDADB240", borderBottom: "1px solid #EDADB240" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
              style={{ background: "#F5C7D140", color: "#D16484" }}
            >
              Emergencias
            </div>
            <h2 className="font-erstoria text-2xl text-[#1F4D2E] mb-4">En caso de crisis inmediata</h2>
            <p className="font-karla text-[#6D8F7A] mb-8 leading-relaxed">
              Si estás experimentando una crisis de salud mental o pensamientos de autolesión, busca ayuda inmediata:
            </p>
            <div
              className="bg-white rounded-3xl p-8 border"
              style={{ borderColor: "#EDADB280", boxShadow: "0 4px 24px rgba(209,100,132,0.08)" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "#F5C7D1" }}
                  >
                    <Phone className="w-5 h-5" style={{ color: "#D16484" }} />
                  </div>
                  <p className="font-karla font-semibold text-sm text-[#1F4D2E] mb-1">Línea de la Vida (México)</p>
                  <a href="tel:8009112000" className="font-karla font-bold text-2xl text-[#12A357] hover:underline">
                    800 911 2000
                  </a>
                  <p className="font-karla text-xs text-[#6D8F7A] mt-1">Disponible 24/7</p>
                </div>
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "#F5C7D1" }}
                  >
                    <Phone className="w-5 h-5" style={{ color: "#D16484" }} />
                  </div>
                  <p className="font-karla font-semibold text-sm text-[#1F4D2E] mb-1">Servicios de emergencia</p>
                  <a href="tel:911" className="font-karla font-bold text-2xl text-[#12A357] hover:underline">
                    911
                  </a>
                  <p className="font-karla text-xs text-[#6D8F7A] mt-1">Emergencias generales</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 md:py-20"
        style={{ background: "linear-gradient(160deg, #FFFBEF 0%, #FFF8EC 50%, #F6E4B2 100%)", borderTop: "1px solid #F6E4B280" }}
      >
        <div className="container mx-auto px-4 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
            style={{ background: "#F6E4B2", color: "#D9A932" }}
          >
            Soporte
          </div>
          <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] mb-3">¿No encuentras lo que buscas?</h2>
          <p className="font-karla text-[#6D8F7A] mb-8 max-w-lg mx-auto">
            Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos pronto.
          </p>
          <Link to="/contact">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(18,163,87,0.22)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar
            </motion.button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default FAQ;
