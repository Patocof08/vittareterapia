import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NotifPrefs {
  email_session_reminder: boolean;
  email_new_message: boolean;
  email_task_assigned: boolean;
  email_payment_update: boolean;
  email_cancellation: boolean;
  email_no_show: boolean;
  email_newsletter: boolean;
}

const NOTIF_CONFIG: Array<{
  key: keyof NotifPrefs;
  title: string;
  description: string;
  defaultValue: boolean;
}> = [
  {
    key: "email_session_reminder",
    title: "Recordatorios de Sesiones",
    description: "Recibe notificaciones antes de tus sesiones programadas",
    defaultValue: true,
  },
  {
    key: "email_new_message",
    title: "Nuevos Mensajes",
    description: "Notificaciones cuando recibas mensajes de tu terapeuta",
    defaultValue: true,
  },
  {
    key: "email_task_assigned",
    title: "Tareas Asignadas",
    description: "Avisos sobre nuevas tareas o ejercicios",
    defaultValue: true,
  },
  {
    key: "email_payment_update",
    title: "Confirmaciones de Pago",
    description: "Recibos y confirmaciones de transacciones",
    defaultValue: true,
  },
  {
    key: "email_cancellation",
    title: "Cancelaciones",
    description: "Notificación cuando se cancele una sesión",
    defaultValue: true,
  },
  {
    key: "email_no_show",
    title: "Inasistencias",
    description: "Notificación si se registra una inasistencia",
    defaultValue: true,
  },
  {
    key: "email_newsletter",
    title: "Boletín y Promociones",
    description: "Consejos de bienestar y ofertas especiales",
    defaultValue: false,
  },
];

export default function ClientOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>({
    email_session_reminder: true,
    email_new_message: true,
    email_task_assigned: true,
    email_payment_update: true,
    email_cancellation: true,
    email_no_show: true,
    email_newsletter: false,
  });

  const handleComplete = async () => {
    if (!user || !termsAccepted) return;
    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: prefsError } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            user_type: "client",
            email_session_reminder: prefs.email_session_reminder,
            email_new_message: prefs.email_new_message,
            email_task_assigned: prefs.email_task_assigned,
            email_payment_update: prefs.email_payment_update,
            email_cancellation: prefs.email_cancellation,
            email_no_show: prefs.email_no_show,
            email_newsletter: prefs.email_newsletter,
          },
          { onConflict: "user_id" }
        );

      if (prefsError) throw prefsError;

      navigate("/portal");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Error al guardar. Por favor intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Vittare</h1>
        <p className="text-muted-foreground mt-1">Plataforma de terapia en línea</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Sección 1: Términos */}
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido a Vittare</CardTitle>
            <CardDescription>
              Antes de empezar, necesitamos que revises y aceptes nuestros términos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen de términos */}
            <div
              className="max-h-72 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-3 text-muted-foreground"
            >
              <p className="font-semibold text-foreground">Puntos clave de nuestros Términos y Condiciones:</p>

              <div className="space-y-1">
                <p className="font-medium text-foreground">1. Intermediación, no consultorio</p>
                <p>Vittare es una plataforma de intermediación que conecta psicólogos certificados con pacientes. No somos un consultorio ni proveemos servicios de salud directamente.</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">2. Grabación y transcripción de sesiones</p>
                <p>Las sesiones se realizan por videollamada y pueden grabarse con transcripción automática. La transcripción es de uso exclusivo del terapeuta para generar resúmenes clínicos y mejorar el seguimiento de tu proceso. No se comparte con terceros.</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">3. Privacidad y datos personales</p>
                <p>Tus datos se manejan conforme a nuestro Aviso de Privacidad y la legislación mexicana aplicable (LFPDPPP). Solo recopilamos la información necesaria para brindarte el servicio.</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">4. Cancelaciones y reembolsos</p>
                <p>Puedes cancelar sin cargo con al menos 24 horas de anticipación. Las cancelaciones tardías (menos de 24h) se cobrarán en su totalidad. Los reembolsos de sesiones individuales se procesan en 3-5 días hábiles.</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">5. Comunicación dentro de la plataforma</p>
                <p>Toda comunicación con tu terapeuta debe realizarse a través de los canales de Vittare. No está permitido intercambiar información de contacto personal ni acordar sesiones fuera de la plataforma.</p>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">6. No es un servicio de emergencias</p>
                <p>Vittare no es un servicio de crisis o emergencias. Si estás en peligro inmediato, contacta a los servicios de emergencia o la Línea de la Vida: <span className="font-medium text-foreground">800 911 2000</span>.</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <a
                href="/terms"
                target="_blank"
                className="text-primary hover:underline"
              >
                Leer términos completos
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="/privacy"
                target="_blank"
                className="text-primary hover:underline"
              >
                Leer aviso de privacidad
              </a>
            </div>

            {/* Checkbox de aceptación */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-relaxed cursor-pointer"
              >
                He leído y acepto los{" "}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Términos y Condiciones
                </a>{" "}
                y el{" "}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Aviso de Privacidad
                </a>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Notificaciones</CardTitle>
            <CardDescription>
              Elige qué emails quieres recibir. Puedes cambiar esto después en Ajustes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {NOTIF_CONFIG.map(({ key, title, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={(value) =>
                    setPrefs((prev) => ({ ...prev, [key]: value }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Botón final */}
        <Button
          onClick={handleComplete}
          size="lg"
          className="w-full"
          disabled={!termsAccepted || saving}
        >
          {saving ? "Guardando..." : "Comenzar"}
        </Button>
      </div>
    </div>
  );
}
