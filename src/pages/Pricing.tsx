import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Sesión Individual",
      price: 800,
      description: "Perfecta para probar nuestros servicios",
      features: [
        "1 sesión de 50 minutos",
        "Videollamada segura",
        "Facturación disponible",
        "Grabación de notas",
      ],
      popular: false,
    },
    {
      name: "Paquete 4 Sesiones",
      price: 2800,
      pricePerSession: 700,
      description: "Ideal para objetivos a corto plazo",
      features: [
        "4 sesiones de 50 minutos",
        "Ahorra $400 en total",
        "Válido por 2 meses",
        "Videollamada segura",
        "Facturación disponible",
        "Prioridad en agenda",
      ],
      popular: true,
    },
    {
      name: "Paquete 8 Sesiones",
      price: 5200,
      pricePerSession: 650,
      description: "Perfecto para transformación profunda",
      features: [
        "8 sesiones de 50 minutos",
        "Ahorra $1,200 en total",
        "Válido por 4 meses",
        "Videollamada segura",
        "Facturación disponible",
        "Prioridad en agenda",
        "Material complementario",
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Precios transparentes y flexibles</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Sin costos ocultos. Elige el plan que mejor se adapte a tus necesidades.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-card rounded-2xl shadow-large p-8 border-2 transition-all hover:shadow-xl relative ${
                  plan.popular ? "border-primary scale-105" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Más popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    {plan.pricePerSession && (
                      <span className="text-sm text-muted-foreground">
                        (${plan.pricePerSession}/sesión)
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/therapists">
                  <Button
                    variant={plan.popular ? "hero" : "default"}
                    className="w-full"
                    size="lg"
                  >
                    Elegir plan
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Políticas y condiciones</h2>

            <div className="space-y-6">
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-start space-x-3">
                  <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Política de cancelación</h3>
                    <p className="text-sm text-muted-foreground">
                      Puedes cancelar o reprogramar tu sesión con al menos 24 horas de anticipación sin cargo.
                      Cancelaciones con menos de 24 horas se cobrarán el 50% del valor de la sesión.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-start space-x-3">
                  <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Política de reembolsos</h3>
                    <p className="text-sm text-muted-foreground">
                      Los paquetes pueden ser reembolsados dentro de los primeros 7 días de la compra si no se ha
                      utilizado ninguna sesión. Después de usar una sesión, no se realizan reembolsos, pero puedes
                      transferir sesiones a otro terapeuta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-start space-x-3">
                  <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Facturación</h3>
                    <p className="text-sm text-muted-foreground">
                      Emitimos facturas fiscales (CFDI) para todos los pagos. Puedes solicitarla al momento del
                      pago o después desde tu cuenta. Las facturas se envían en un plazo máximo de 72 horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-start space-x-3">
                  <Info className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Métodos de pago</h3>
                    <p className="text-sm text-muted-foreground">
                      Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias
                      bancarias y pagos a través de PayPal. Todos los pagos son procesados de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Tienes dudas sobre nuestros precios?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Contáctanos y resolveremos todas tus preguntas.
          </p>
          <Link to="/contact">
            <Button variant="default" size="lg">
              Contactar
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
