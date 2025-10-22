import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Términos y Condiciones</h1>
          <p className="text-muted-foreground mb-8">Última actualización: Marzo 2024</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">1. Aceptación de los términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Al acceder y utilizar los servicios de Vittare, usted acepta estar sujeto a estos Términos y
                Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar
                nuestros servicios.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">2. Descripción del servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vittare es una plataforma de terapia psicológica en línea que conecta a pacientes con
                terapeutas profesionales certificados. Nuestros servicios incluyen sesiones individuales por
                videollamada, recursos de salud mental, y gestión de citas.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">3. Requisitos para usar el servicio</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Para utilizar nuestros servicios:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Debe ser mayor de 18 años o contar con autorización de un tutor legal</li>
                <li>Debe proporcionar información veraz y actualizada</li>
                <li>Debe tener acceso a internet estable y un dispositivo compatible</li>
                <li>No debe usar el servicio para actividades ilegales</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">4. Registro y cuenta</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para utilizar nuestros servicios, debe crear una cuenta proporcionando información precisa. Es
                su responsabilidad mantener la confidencialidad de sus credenciales de acceso y todas las
                actividades realizadas bajo su cuenta.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">5. Servicios terapéuticos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Importante entender que:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Los servicios no son para emergencias médicas o crisis de salud mental</li>
                <li>En caso de emergencia, debe contactar servicios de emergencia locales</li>
                <li>La terapia en línea no reemplaza la evaluación médica presencial cuando sea necesaria</li>
                <li>Los terapeutas están certificados pero la terapia requiere su participación activa</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">6. Pagos y facturación</h2>
              <p className="text-muted-foreground leading-relaxed">
                Los precios de nuestros servicios están claramente indicados en la plataforma. Todos los pagos
                deben realizarse por adelantado. Ofrecemos facturación fiscal (CFDI) para todos los servicios.
                Los pagos son procesados de forma segura a través de nuestros proveedores de pago certificados.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">7. Cancelaciones y reembolsos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Política de cancelación:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Cancelación con 24+ horas de anticipación: sin cargo</li>
                <li>Cancelación con menos de 24 horas: 50% del valor de la sesión</li>
                <li>Inasistencia sin aviso: 100% del valor de la sesión</li>
                <li>Reembolsos de paquetes: disponibles dentro de 7 días si no se ha usado ninguna sesión</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">8. Confidencialidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Toda la información compartida en las sesiones de terapia está protegida por el secreto
                profesional, de acuerdo con las leyes aplicables y el código ético de la profesión. Sus datos
                personales y clínicos son tratados con la máxima confidencialidad según nuestro Aviso de
                Privacidad.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">9. Propiedad intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo el contenido de la plataforma, incluyendo textos, gráficos, logos, y software, es
                propiedad de Vittare o sus licenciantes y está protegido por leyes de propiedad intelectual.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">10. Limitación de responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vittare no será responsable por daños indirectos, incidentales, especiales o consecuentes
                derivados del uso o la imposibilidad de usar nuestros servicios. No garantizamos resultados
                específicos de la terapia, ya que estos dependen de múltiples factores individuales.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">11. Modificaciones a los términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
                significativos serán comunicados con al menos 30 días de anticipación. El uso continuado de
                nuestros servicios después de los cambios constituye su aceptación de los nuevos términos.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">12. Ley aplicable y jurisdicción</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los
                tribunales competentes de Ciudad de México.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">13. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para preguntas sobre estos términos, puede contactarnos en:
              </p>
              <p className="text-muted-foreground mt-4">
                Email: legal@vittare.com<br />
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

export default Terms;
