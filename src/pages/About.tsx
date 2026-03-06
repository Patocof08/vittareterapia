import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Shield, Users, Star, Target, Eye } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Empatía",
    description:
      "Creemos que cada persona merece ser escuchada sin juicio. La empatía es el fundamento de toda relación terapéutica.",
  },
  {
    icon: Shield,
    title: "Confidencialidad",
    description:
      "Tu privacidad es sagrada. Toda información compartida en la plataforma está protegida con los más altos estándares de seguridad.",
  },
  {
    icon: Star,
    title: "Excelencia",
    description:
      "Solo trabajamos con psicólogos colegiados y verificados. La calidad de la atención es nuestra responsabilidad.",
  },
  {
    icon: Users,
    title: "Accesibilidad",
    description:
      "La salud mental debe estar al alcance de todos. Ofrecemos opciones flexibles para que nada te detenga.",
  },
  {
    icon: Target,
    title: "Compromiso",
    description:
      "Acompañamos tu proceso desde el primer contacto hasta que alcances tus metas de bienestar.",
  },
  {
    icon: Eye,
    title: "Transparencia",
    description:
      "Sin sorpresas. Precios claros, psicólogos verificados y procesos honestos en cada paso.",
  },
];

const stats = [
  { value: "500+", label: "Pacientes atendidos" },
  { value: "30+", label: "Psicólogos verificados" },
  { value: "95%", label: "Satisfacción" },
  { value: "3", label: "Años de experiencia" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Sobre Vittare
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Somos una plataforma de terapia en línea fundada en México con una misión clara: hacer que la salud mental sea accesible, segura y efectiva para todos.
          </p>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Nuestra misión</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                En Vittare conectamos a personas que buscan apoyo emocional con psicólogos profesionales verificados. Creemos que pedir ayuda es un acto de valentía, y nuestro trabajo es hacer ese camino lo más sencillo y seguro posible.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cada psicólogo en nuestra plataforma pasa por un riguroso proceso de verificación de credenciales, cédula profesional y experiencia clínica. No aceptamos menos cuando se trata de tu bienestar.
              </p>
            </div>
            <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Nuestra visión
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Ser la plataforma de salud mental de referencia en América Latina, donde cualquier persona pueda acceder a atención psicológica de calidad sin importar su ubicación o situación económica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestros valores</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Estos principios guían cada decisión que tomamos, desde cómo verificamos a nuestros psicólogos hasta cómo protegemos tu información.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué Vittare */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">¿Por qué Vittare?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Psicólogos verificados</h3>
              <p className="text-sm text-muted-foreground">
                Revisamos cédula profesional, título y experiencia antes de aprobar a cualquier terapeuta.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Sesiones desde casa</h3>
              <p className="text-sm text-muted-foreground">
                Videollamadas seguras desde cualquier lugar. Sin traslados ni salas de espera.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Atención continua</h3>
              <p className="text-sm text-muted-foreground">
                Mensajería directa con tu terapeuta, seguimiento de tareas y notas de sesión en un solo lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Da el primer paso hoy
          </h2>
          <p className="text-muted-foreground mb-8">
            Encontrar al psicólogo adecuado es más fácil de lo que crees. Explora nuestro directorio y agenda tu primera sesión.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/therapists">Conocer terapeutas</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contáctanos</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
