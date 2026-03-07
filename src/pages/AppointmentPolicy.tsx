import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const AppointmentPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Política de Citas</h1>
          <p className="text-muted-foreground mb-12">Última actualización: Marzo 2026</p>

          <div className="prose prose-lg max-w-none">

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">1. Política de cancelación</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Entendemos que pueden surgir imprevistos. Para garantizar una experiencia justa tanto para pacientes como para psicólogos, aplicamos las siguientes reglas de cancelación:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Con más de 24 horas de anticipación:</strong> Puedes cancelar sin cargo. Elige entre un reembolso completo a tu método de pago original o un crédito en la plataforma válido por 6 meses.</li>
                <li><strong className="text-foreground">Con menos de 24 horas de anticipación:</strong> La sesión se cobra en su totalidad y no aplica reembolso. Esto protege el tiempo que el psicólogo reservó exclusivamente para ti.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">2. Inasistencia (No-Show)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Si no te presentas a tu sesión sin previo aviso:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>La sesión se cobra en su totalidad.</li>
                <li>No aplica reembolso ni crédito.</li>
                <li>Recibirás una notificación informándote del registro de inasistencia.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Si crees que hubo un error técnico que te impidió conectarte, comunícate con tu psicólogo a través de la plataforma para encontrar una solución.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">3. Reembolsos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Los reembolsos se procesan de la siguiente manera:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Sesiones individuales:</strong> Al cancelar con más de 24 horas, puedes elegir reembolso completo (se refleja en 3-5 días hábiles en tu estado de cuenta) o crédito en la plataforma.</li>
                <li><strong className="text-foreground">Paquetes de sesiones:</strong> Al cancelar una sesión de paquete con más de 24 horas, el crédito se devuelve automáticamente a tu paquete para que lo uses en otra sesión.</li>
                <li><strong className="text-foreground">Cancelaciones tardías e inasistencias:</strong> No aplica reembolso.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">4. Puntualidad</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para aprovechar al máximo tu sesión, te recomendamos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Conectarte a la plataforma al menos 5 minutos antes de la hora programada.</li>
                <li>Verificar que tu cámara, micrófono y conexión a internet funcionen correctamente.</li>
                <li>Estar en un espacio tranquilo y privado donde puedas hablar con libertad.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Si llegas tarde, la sesión no se extenderá más allá de la hora programada de finalización. El tiempo perdido por retraso del paciente no es recuperable ni reembolsable.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">5. Confidencialidad</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tu privacidad es fundamental en Vittare:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Todo lo que compartas en tus sesiones es estrictamente confidencial entre tú y tu psicólogo.</li>
                <li>Los psicólogos en Vittare están sujetos al secreto profesional conforme a la normativa mexicana vigente.</li>
                <li>Vittare no tiene acceso al contenido de tus sesiones.</li>
                <li>Las videollamadas se realizan a través de servidores seguros. No se graban ni almacenan sesiones sin tu consentimiento explícito.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Excepción: conforme a la ley, el psicólogo está obligado a romper la confidencialidad únicamente cuando exista riesgo inminente para tu vida o la de terceros.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">6. Reagendamiento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si necesitas cambiar la fecha u hora de tu sesión, cancela la cita actual (respetando la política de 24 horas) y agenda una nueva en el horario que mejor te funcione. Puedes hacerlo desde tu portal de cliente en la sección "Mis Sesiones".
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">7. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tienes dudas sobre estas políticas o necesitas asistencia con una situación especial, escríbenos a{" "}
                <a href="mailto:contacto@vittareterapia.com" className="text-primary hover:underline">
                  contacto@vittareterapia.com
                </a>.
              </p>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AppointmentPolicy;
