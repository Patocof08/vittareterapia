import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Aviso de Privacidad</h1>
          <p className="text-muted-foreground mb-8">Última actualización: Marzo 2024</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">1. Responsable del tratamiento de datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vittare, con domicilio en Ciudad de México, México, es responsable del tratamiento de sus
                datos personales de conformidad con la Ley Federal de Protección de Datos Personales en
                Posesión de los Particulares.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">2. Datos personales que recabamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para la prestación de nuestros servicios de terapia en línea, recabamos las siguientes
                categorías de datos personales:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Datos de identificación: nombre completo, fecha de nacimiento, correo electrónico</li>
                <li>Datos de contacto: teléfono, dirección</li>
                <li>Datos de salud: información sobre su estado de salud mental y emocional</li>
                <li>Datos financieros: información de pago y facturación</li>
                <li>Datos de sesiones: notas clínicas, grabaciones de sesiones (con su consentimiento)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">3. Finalidades del tratamiento</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Sus datos personales serán utilizados para las siguientes finalidades:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Prestación de servicios de terapia psicológica en línea</li>
                <li>Seguimiento de su proceso terapéutico</li>
                <li>Procesamiento de pagos y facturación</li>
                <li>Comunicación sobre citas y recordatorios</li>
                <li>Mejora de nuestros servicios</li>
                <li>Cumplimiento de obligaciones legales</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">4. Protección de datos sensibles</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reconocemos que los datos de salud mental son especialmente sensibles. Implementamos las
                medidas de seguridad más estrictas, incluyendo cifrado de extremo a extremo para todas las
                comunicaciones, almacenamiento seguro de datos clínicos, y acceso restringido solo al personal
                autorizado.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">5. Compartición de datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sus datos personales solo serán compartidos con terceros en los siguientes casos: con su
                consentimiento expreso, cuando sea requerido por autoridades competentes, con proveedores de
                servicios que nos ayudan a operar la plataforma (bajo estrictos acuerdos de confidencialidad).
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">6. Derechos ARCO</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos inexactos o incompletos</li>
                <li>Cancelar sus datos cuando considere que no se requieren</li>
                <li>Oponerse al tratamiento de sus datos para fines específicos</li>
                <li>Revocar su consentimiento para el tratamiento de datos</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Para ejercer estos derechos, puede enviar una solicitud a privacidad@vittare.com
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">7. Cookies y tecnologías de rastreo</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma.
                Puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas
                funcionalidades del sitio.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">8. Cambios al aviso de privacidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos reservamos el derecho de actualizar este aviso de privacidad. Cualquier cambio será
                comunicado a través de nuestra plataforma y/o por correo electrónico.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">9. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para cualquier duda sobre este aviso de privacidad o sobre el tratamiento de sus datos
                personales, puede contactarnos en:
              </p>
              <p className="text-muted-foreground mt-4">
                Email: privacidad@vittare.com<br />
                Teléfono: +52 55 1234 5678
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;
