import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary to-primary-dark text-primary-foreground py-28">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-widest opacity-70 mb-4">Acerca de</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight max-w-4xl mx-auto">
            Nos apasiona hacer la salud mental accesible para todos.
          </h1>
        </div>
      </section>

      {/* Acerca de — texto narrativo */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Acerca de</h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                En México, millones de personas viven con ansiedad, estrés y presión constante,
                pero siguen encontrando barreras para pedir ayuda: miedo al qué dirán, procesos
                complicados, falta de información y una experiencia que se siente lejana e impersonal.
              </p>
              <p>
                En Vittare creemos que cuidar tu salud mental no debería ser complicado ni estar
                lleno de estigmas. Somos un equipo dedicado a transformar la forma en que las
                personas acceden a terapia psicológica: con psicólogos verificados, procesos claros,
                y una experiencia diseñada para sentirse segura, cercana y humana. Queremos que
                dar el paso hacia la terapia deje de sentirse difícil y se convierta en algo natural,
                accesible y confiable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Imagen grande */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <img
            src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=1400&auto=format&fit=crop"
            alt="Personas conectando en un espacio seguro"
            className="w-full h-[400px] md:h-[500px] object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* Filosofía */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-10">Nuestra Filosofía</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Transformamos</strong> las barreras que rodean
                  la salud mental en puentes que conectan a las personas con el apoyo que necesitan.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Hacemos</strong> de la terapia una experiencia
                  accesible, humana y libre de juicios — donde cada persona se sienta escuchada.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Creemos</strong> que pedir ayuda es un acto
                  de valentía, no de debilidad, y que todos merecen un espacio seguro para
                  reconectar consigo mismos.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Dos imágenes lado a lado */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <img
            src="https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?q=80&w=800&auto=format&fit=crop"
            alt="Bienestar y crecimiento personal"
            className="w-full h-[300px] md:h-[350px] object-cover rounded-2xl"
          />
          <img
            src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=800&auto=format&fit=crop"
            alt="Espacio de trabajo colaborativo"
            className="w-full h-[300px] md:h-[350px] object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* Visión */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Nuestra Visión</h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
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
                En este futuro, la salud mental en América Latina deja de ser un tema tabú.
                Las personas no solo buscan ayuda, sino que la encuentran fácilmente. En
                Vittare creemos que ese futuro no es lejano — es el que estamos construyendo hoy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Imagen grande */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <img
            src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1400&auto=format&fit=crop"
            alt="Conexión y bienestar"
            className="w-full h-[400px] md:h-[500px] object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* Historia */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Nuestra Historia</h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
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
                El momento clave fue entender que no bastaba con hablar más del tema.
                Hacía falta crear algo diferente: un espacio donde pacientes y profesionales
                pudieran encontrarse de una mejor manera. Sin complicaciones. Sin juicios.
                Con la calidez que este proceso merece.
              </p>
              <p>
                Hoy seguimos creciendo con esa misma convicción — demostrando que la
                terapia puede ser simple, personalizada y accesible para todos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Significado del nombre */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              ¿Qué significa Vittare?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Vittare es un nombre que transmite bienestar, crecimiento y reconexión personal.
              Más que describir un servicio, representa la experiencia que queremos construir.
            </p>
            <p className="text-2xl font-semibold text-foreground mt-8">
              "Un espacio seguro para reconectar contigo."
            </p>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Quiénes estamos detrás
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Un equipo pequeño con una misión grande: transformar la forma en que
              México se acerca a la salud mental.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
              {/* Patricio */}
              <div className="text-center">
                <div className="w-40 h-40 bg-muted rounded-2xl mx-auto mb-6 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
                    alt="Patricio Cohen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold">Patricio Cohen</h3>
                <p className="text-primary font-medium text-sm mb-3">
                  Co-Founder · Estrategia y Desarrollo de Negocio
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Encargado de la visión general de Vittare, la construcción del modelo
                  de negocio, el crecimiento del proyecto y las alianzas estratégicas.
                </p>
              </div>

              {/* Santiago */}
              <div className="text-center">
                <div className="w-40 h-40 bg-muted rounded-2xl mx-auto mb-6 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop"
                    alt="Santiago Sales"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold">Santiago Sales</h3>
                <p className="text-primary font-medium text-sm mb-3">
                  Co-Founder
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Socio fundador de Vittare, enfocado en la construcción y consolidación
                  del proyecto desde sus etapas iniciales, aportando a su desarrollo y ejecución.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-8">
              Las fotos del equipo son temporales — reemplazar con fotos reales.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tu bienestar empieza con un paso
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            No tienes que hacerlo solo. Encuentra al psicólogo ideal para ti y
            comienza tu proceso desde la comodidad de tu hogar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/therapists">
              <Button variant="secondary" size="lg">
                Encontrar mi psicólogo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/para-psicologos">
              <Button variant="ghost" size="lg" className="text-white border border-white/50 hover:bg-white/15 hover:text-white">
                Soy psicólogo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
