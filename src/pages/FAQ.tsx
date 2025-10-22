import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { mockFAQs } from "@/data/mockData";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 py-16 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Preguntas frecuentes</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra respuestas a las preguntas más comunes sobre nuestros servicios
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {mockFAQs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl shadow-soft px-6"
                >
                  <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-20 bg-destructive/10 border-y border-destructive/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-destructive">En caso de emergencia</h2>
            <p className="text-muted-foreground mb-6">
              Si estás experimentando una crisis de salud mental o pensamientos de autolesión, por favor busca
              ayuda inmediata:
            </p>
            <div className="bg-card rounded-xl shadow-soft p-6 border border-border space-y-4">
              <div>
                <p className="font-semibold mb-2">Línea de la Vida (México)</p>
                <a href="tel:8009112000" className="text-2xl font-bold text-primary hover:underline">
                  800 911 2000
                </a>
                <p className="text-sm text-muted-foreground mt-1">Disponible 24/7</p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="font-semibold mb-2">Servicios de emergencia</p>
                <a href="tel:911" className="text-2xl font-bold text-primary hover:underline">
                  911
                </a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              La terapia en línea no está diseñada para situaciones de crisis inmediatas. Por favor, utiliza los
              recursos de emergencia si necesitas ayuda urgente.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
          </p>
          <Link to="/contact">
            <Button variant="hero" size="lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Contactar
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
