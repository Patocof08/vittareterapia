import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Calendar, CreditCard, Users, Video, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ParaPsicologos() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleJoinClick = async () => {
    // Si está logueado como paciente, ofrecer cerrar sesión
    if (user && role === "cliente") {
      toast.error("Ya tienes una sesión activa como paciente", {
        description: "Cierra tu sesión actual para registrarte como psicólogo",
        action: {
          label: "Cerrar sesión",
          onClick: async () => {
            await signOut();
            navigate("/onboarding-psicologo");
          }
        },
        duration: 10000
      });
      return;
    }
    
    // Si está logueado como psicólogo, ir al dashboard
    if (user && role === "psicologo") {
      navigate("/therapist/dashboard");
      return;
    }
    
    // Si no está logueado, ir al onboarding
    navigate("/onboarding-psicologo");
  };

  const benefits = [
    {
      icon: Calendar,
      title: "Agenda automatizada",
      description: "Gestiona tu disponibilidad y sesiones sin complicaciones. Los pacientes agendan directamente contigo."
    },
    {
      icon: CreditCard,
      title: "Pagos simplificados",
      description: "Recibe tus pagos de forma segura y automática. Sin comisiones ocultas."
    },
    {
      icon: Users,
      title: "Herramientas profesionales",
      description: "Seguimiento de pacientes, asignación de tareas y expedientes digitales en un solo lugar."
    },
    {
      icon: Video,
      title: "Videollamadas seguras",
      description: "Plataforma integrada para sesiones virtuales con la mejor calidad y privacidad."
    },
    {
      icon: Shield,
      title: "Verificación profesional",
      description: "Tu perfil verificado genera confianza. Nosotros validamos tu cédula y credenciales."
    },
    {
      icon: CheckCircle2,
      title: "Libertad total",
      description: "Fija tus horarios, precios y metodología. Tú decides cómo trabajar."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Regístrate",
      description: "Completa tu perfil profesional con tu experiencia, especialidades y enfoque terapéutico."
    },
    {
      number: "2",
      title: "Configura",
      description: "Sube tus documentos, define tu disponibilidad y establece tus tarifas."
    },
    {
      number: "3",
      title: "Publica",
      description: "Una vez verificado, tu perfil estará visible y comenzarás a recibir solicitudes de pacientes."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Conecta con pacientes. Crece con Vittare.
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              La plataforma que facilita tu práctica independiente. Gestiona tu agenda, recibe pagos automáticos 
              y mantén todo organizado en un solo lugar.
            </p>
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleJoinClick}>
              Únete al equipo
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ¿Qué ofrece Vittare a los psicólogos?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Herramientas profesionales diseñadas para que te enfoques en lo que realmente importa: tus pacientes.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-card p-6 rounded-xl shadow-soft border border-border">
                <benefit.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Tres pasos simples para comenzar a construir tu práctica independiente.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comunidad Vittare
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              No trabajas solo. Formas parte de una comunidad de profesionales que crece junta.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-2">Capacitación continua</h3>
                <p className="text-sm text-muted-foreground">Sesiones de formación y webinars para seguir creciendo.</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-2">Soporte técnico</h3>
                <p className="text-sm text-muted-foreground">Equipo disponible para resolver cualquier duda o problema.</p>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-2">Red de profesionales</h3>
                <p className="text-sm text-muted-foreground">Conecta con otros terapeutas y comparte experiencias.</p>
              </div>
            </div>
            <p className="text-lg font-medium mb-6">
              Crece con nosotros, no trabajes solo.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 to-primary/5 p-12 rounded-2xl border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para dar el siguiente paso?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Únete a los profesionales que ya confían en Vittare para gestionar su práctica.
            </p>
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleJoinClick}>
              Únete al equipo
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
