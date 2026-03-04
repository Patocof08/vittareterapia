import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Política de Cookies</h1>
          <p className="text-muted-foreground mb-8">Última actualización: Marzo 2026</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">1. ¿Qué son las cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
                visitas un sitio web. Nos permiten reconocer tu navegador y recordar ciertas
                preferencias para mejorar tu experiencia de navegación.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">2. Cookies que utilizamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                En Vittare utilizamos los siguientes tipos de cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Cookies esenciales:</strong> Necesarias para
                  el funcionamiento de la plataforma. Incluyen cookies de autenticación de sesión
                  (Supabase Auth) que permiten mantener tu sesión activa mientras navegas.
                </li>
                <li>
                  <strong className="text-foreground">Cookies de preferencias:</strong> Almacenan tus
                  preferencias de interfaz como el tema visual (claro/oscuro) para que no tengas que
                  configurarlas en cada visita.
                </li>
                <li>
                  <strong className="text-foreground">Cookies de seguridad:</strong> Utilizadas para
                  prevenir fraude y proteger tu cuenta, incluyendo tokens de verificación y protección
                  contra ataques CSRF.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">3. Cookies de terceros</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos servicios de terceros que pueden establecer sus propias cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                <li>
                  <strong className="text-foreground">Stripe:</strong> Para el procesamiento seguro
                  de pagos. Stripe utiliza cookies para prevenir fraude y autenticar transacciones.
                </li>
                <li>
                  <strong className="text-foreground">Daily.co:</strong> Para las sesiones de
                  videollamada. Daily utiliza cookies técnicas necesarias para el funcionamiento del
                  servicio de video.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">4. Cookies que NO utilizamos</h2>
              <p className="text-muted-foreground leading-relaxed">
                En Vittare <strong className="text-foreground">no</strong> utilizamos cookies de
                publicidad, cookies de seguimiento para terceros, ni cookies de redes sociales. No
                vendemos ni compartimos datos de navegación con anunciantes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">5. Control de cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Puedes configurar tu navegador para rechazar cookies o para que te avise cuando se
                envíen. Sin embargo, si desactivas las cookies esenciales, algunas funciones de la
                plataforma podrían no funcionar correctamente (por ejemplo, no podrás mantener tu
                sesión iniciada).
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">6. Cambios a esta política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar esta política de cookies periódicamente. Te notificaremos sobre
                cambios significativos a través de la plataforma.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">7. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tienes preguntas sobre nuestra política de cookies, contáctanos en:
              </p>
              <p className="text-muted-foreground mt-4">
                Email: privacidad@vittareterapia.com
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cookies;
