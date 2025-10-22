import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewCard } from "@/components/ReviewCard";
import { TherapistCard } from "@/components/TherapistCard";
import { Shield, Clock, FileText, DollarSign, CheckCircle, ArrowRight } from "lucide-react";
import { mockReviews, mockTherapists } from "@/data/mockData";

const Index = () => {
  const benefits = [
    {
      icon: Shield,
      title: "100% Confidencial",
      description: "Tu privacidad está protegida con cifrado de extremo a extremo",
    },
    {
      icon: Clock,
      title: "Horarios Flexibles",
      description: "Agenda sesiones que se ajusten a tu rutina, 7 días a la semana",
    },
    {
      icon: FileText,
      title: "Recibos y Facturación",
      description: "Emitimos facturas fiscales (CFDI) para todos los servicios",
    },
    {
      icon: DollarSign,
      title: "Precios Transparentes",
      description: "Sin costos ocultos. Conoce el precio desde el inicio",
    },
    {
      icon: CheckCircle,
      title: "Terapeutas Certificados",
      description: "Todos nuestros profesionales están certificados y verificados",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGMwLTYuNjI3LTUuMzczLTEyLTEyLTEyczEyIDUuMzczIDEyIDEyIDUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyIDUuMzczLTEyIDEyLTEyLTUuMzczLTEyLTEyLTEyek0xMyAxMzRjMC02LjYyNy01LjM3My0xMi0xMi0xMnMxMiA1LjM3MyAxMiAxMiA1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMiA1LjM3My0xMiAxMi0xMi01LjM3My0xMi0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Terapia en línea segura y sencilla
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Conecta con terapeutas profesionales desde la comodidad de tu hogar. Tu bienestar mental empieza aquí.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/therapists">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Agendar sesión
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/therapists">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Conoce a los terapeutas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por qué elegir Vittare?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hacemos que cuidar de tu salud mental sea fácil, accesible y profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-card rounded-xl shadow-soft p-6 hover:shadow-medium transition-all border border-border"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Therapists */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros terapeutas destacados</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Profesionales certificados y con amplia experiencia listos para ayudarte
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
            {mockTherapists.slice(0, 2).map((therapist) => (
              <TherapistCard key={therapist.id} {...therapist} />
            ))}
          </div>

          <div className="text-center">
            <Link to="/therapists">
              <Button variant="default" size="lg">
                Ver todos los terapeutas
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros pacientes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Miles de personas han transformado su bienestar con Vittare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {mockReviews.map((review, index) => (
              <ReviewCard key={index} {...review} />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Certificaciones y avales</h2>
            <p className="text-lg text-muted-foreground">
              Respaldados por las principales instituciones de salud mental
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-12 max-w-4xl mx-auto opacity-60">
            <div className="text-center">
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mb-2">
                <span className="text-xs text-muted-foreground">Logo Colegio</span>
              </div>
              <p className="text-sm text-muted-foreground">Colegio de Psicólogos</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mb-2">
                <span className="text-xs text-muted-foreground">Logo Certificación</span>
              </div>
              <p className="text-sm text-muted-foreground">Certificación Nacional</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mb-2">
                <span className="text-xs text-muted-foreground">Logo Aval</span>
              </div>
              <p className="text-sm text-muted-foreground">Aval Institucional</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Da el primer paso hacia tu bienestar
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Comienza tu viaje de crecimiento personal con un terapeuta profesional hoy mismo
          </p>
          <Link to="/therapists">
            <Button variant="secondary" size="lg">
              Agendar primera sesión
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
