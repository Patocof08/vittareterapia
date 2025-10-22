import { HelpCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const therapistFAQs = [
  {
    question: "¿Cómo configuro mi disponibilidad?",
    answer:
      'Ve a la sección "Calendario" y haz clic en "Configurar disponibilidad". Puedes establecer horarios recurrentes para cada día de la semana.',
  },
  {
    question: "¿Cómo cancelo o reprogramo una sesión?",
    answer:
      'En la sección "Sesiones", encuentra la sesión que deseas modificar y selecciona la opción correspondiente. El paciente recibirá una notificación automática.',
  },
  {
    question: "¿Cuándo recibo mis pagos?",
    answer:
      "Los pagos se procesan semanalmente y se depositan en tu cuenta bancaria registrada. Puedes ver el detalle en la sección de Pagos.",
  },
  {
    question: "¿Puedo compartir materiales con mis pacientes?",
    answer:
      'Sí, en la sección "Biblioteca" puedes subir materiales y compartirlos con pacientes específicos. Ellos recibirán una notificación cuando compartas algo nuevo.',
  },
  {
    question: "¿Cómo funciona la videollamada?",
    answer:
      "Las videollamadas se generan automáticamente para cada sesión confirmada. Solo debes hacer clic en el enlace cuando llegue la hora de la sesión.",
  },
];

export default function TherapistSupport() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Ticket enviado. Te responderemos en breve.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Soporte</h1>
        <p className="text-muted-foreground mt-1">
          Encuentra ayuda o contacta con nuestro equipo
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preguntas frecuentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Preguntas frecuentes para terapeutas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {therapistFAQs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Formulario de contacto */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enviar ticket de soporte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" type="email" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Problema técnico</SelectItem>
                    <SelectItem value="pagos">Pagos y facturación</SelectItem>
                    <SelectItem value="cuenta">Gestión de cuenta</SelectItem>
                    <SelectItem value="sesiones">Sesiones y calendario</SelectItem>
                    <SelectItem value="pacientes">Gestión de pacientes</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea id="message" rows={6} required />
              </div>

              <Button type="submit" size="lg">
                <Send className="w-4 h-4 mr-2" />
                Enviar ticket
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
