import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/lib/validation";
import { z } from "zod";
import { motion } from "framer-motion";

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  { icon: Mail, label: "Correo electrónico", value: "contacto@vittareterapia.com", href: "mailto:contacto@vittareterapia.com", color: "#12A357", bg: "#D4F0E2" },
  { icon: Phone, label: "Teléfono / WhatsApp", value: "+52 55 1234 5678", href: "tel:+525512345678", color: "#6AB7AB", bg: "#BFE9E2" },
  { icon: MapPin, label: "Ubicación", value: "Ciudad de México, México", href: null, color: "#D9A932", bg: "#F6E4B2" },
  { icon: Clock, label: "Horario de atención", value: "Lun – Vie · 9:00 – 18:00 hrs", href: null, color: "#D16484", bg: "#F5C7D1" },
];

const Contact = () => {
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", reason: "", message: "" }
  });

  const reasonValue = watch("reason");
  const [sending, setSending] = useState(false);

  const onSubmit = async (data: ContactFormData) => {
    setSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-form`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, email: data.email, subject: data.reason, message: data.message }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al enviar el mensaje");
      toast.success("Mensaje enviado correctamente. Te responderemos pronto.");
      reset();
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el mensaje. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

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
        </div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
              style={{ background: "#BFE9E2", color: "#12A357" }}
            >
              <MessageCircle className="w-3 h-3" />
              Contáctanos
            </div>
            <h1 className="font-erstoria text-[clamp(2rem,5vw,3.5rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.025em] mb-4">
              Estamos aquí para ti
            </h1>
            <p className="font-karla text-lg text-[#6D8F7A] max-w-xl mx-auto leading-relaxed">
              Envíanos un mensaje y te responderemos lo antes posible.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20 flex-1">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="font-erstoria text-2xl text-[#1F4D2E] mb-2">Información de contacto</h2>
              <p className="font-karla text-[#6D8F7A] mb-8 leading-relaxed">
                Puedes contactarnos a través del formulario o por los siguientes medios.
              </p>

              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 p-4 bg-white rounded-2xl border"
                    style={{ borderColor: "#BFE9E2", boxShadow: "0 2px 12px rgba(18,163,87,0.05)" }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="font-karla font-semibold text-sm text-[#1F4D2E] mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="font-karla text-sm text-[#6D8F7A] hover:text-[#12A357] transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-karla text-sm text-[#6D8F7A]">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div
                className="bg-white rounded-3xl p-8 border"
                style={{ borderColor: "#BFE9E2", boxShadow: "0 8px 40px rgba(18,163,87,0.07)" }}
              >
                <h2 className="font-erstoria text-2xl text-[#1F4D2E] mb-6">Envíanos un mensaje</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="font-karla text-sm text-[#3A6A4C] font-medium">Nombre completo</Label>
                    <Input id="name" type="text" placeholder="Tu nombre" {...register("name")}
                      className="border-[#BFE9E2] focus:border-[#12A357] font-karla rounded-xl" />
                    {errors.name && <p className="font-karla text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="font-karla text-sm text-[#3A6A4C] font-medium">Correo electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" {...register("email")}
                      className="border-[#BFE9E2] focus:border-[#12A357] font-karla rounded-xl" />
                    {errors.email && <p className="font-karla text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-karla text-sm text-[#3A6A4C] font-medium">Motivo de contacto</Label>
                    <Select value={reasonValue} onValueChange={(value) => setValue("reason", value)}>
                      <SelectTrigger className="border-[#BFE9E2] font-karla rounded-xl">
                        <SelectValue placeholder="Selecciona un motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Información general</SelectItem>
                        <SelectItem value="therapist">Preguntas sobre terapeutas</SelectItem>
                        <SelectItem value="pricing">Preguntas sobre precios</SelectItem>
                        <SelectItem value="technical">Soporte técnico</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.reason && <p className="font-karla text-xs text-red-500">{errors.reason.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="font-karla text-sm text-[#3A6A4C] font-medium">Mensaje</Label>
                    <Textarea
                      id="message"
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      rows={5}
                      {...register("message")}
                      className="border-[#BFE9E2] focus:border-[#12A357] font-karla rounded-xl resize-none"
                    />
                    {errors.message && <p className="font-karla text-xs text-red-500">{errors.message.message}</p>}
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(18,163,87,0.25)" }}
                    whileTap={{ scale: 0.98 }}
                    disabled={sending}
                    className="w-full py-4 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer disabled:opacity-60"
                  >
                    {sending ? "Enviando..." : "Enviar mensaje"}
                  </motion.button>

                  <p className="font-karla text-xs text-center text-[#6D8F7A]">
                    Normalmente respondemos en menos de 24 horas
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Contact;
