import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationPrefs {
  email_new_booking: boolean;
  email_session_reminder: boolean;
  email_new_message: boolean;
  email_payment_update: boolean;
  email_cancellation: boolean;
  email_no_show: boolean;
}

const PREFS_CONFIG: Array<{
  key: keyof NotificationPrefs;
  title: string;
  description: string;
}> = [
  {
    key: "email_new_booking",
    title: "Nuevas sesiones reservadas",
    description: "Recibe un email cuando un cliente reserve una sesión",
  },
  {
    key: "email_session_reminder",
    title: "Recordatorios de sesiones",
    description: "Recibe recordatorios 24 horas antes de cada sesión",
  },
  {
    key: "email_new_message",
    title: "Mensajes de clientes",
    description: "Notificaciones cuando recibas mensajes nuevos",
  },
  {
    key: "email_payment_update",
    title: "Actualizaciones de pagos",
    description: "Avisos sobre pagos recibidos y transferencias",
  },
  {
    key: "email_cancellation",
    title: "Cancelaciones",
    description: "Notificación cuando un cliente cancele una sesión",
  },
  {
    key: "email_no_show",
    title: "Inasistencias",
    description: "Notificación cuando se registre una inasistencia",
  },
];

export const Step6Notifications = () => {
  const { prevStep, publishProfile } = useOnboardingContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_new_booking: true,
    email_session_reminder: true,
    email_new_message: true,
    email_payment_update: true,
    email_cancellation: true,
    email_no_show: true,
  });
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!user) return;
    setIsPublishing(true);

    try {
      // Guardar preferencias de notificación
      const { error: prefsError } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            user_type: "psychologist",
            email_new_booking: prefs.email_new_booking,
            email_session_reminder: prefs.email_session_reminder,
            email_new_message: prefs.email_new_message,
            email_payment_update: prefs.email_payment_update,
            email_cancellation: prefs.email_cancellation,
            email_no_show: prefs.email_no_show,
          },
          { onConflict: "user_id" }
        );

      if (prefsError) throw prefsError;

      // Marcar onboarding como completado
      const success = await publishProfile();
      if (success) {
        navigate("/therapist/pending-verification");
      }
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast.error("Error al finalizar el registro");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de Notificaciones</CardTitle>
          <CardDescription>
            Elige qué emails quieres recibir. Puedes cambiar esto después en Ajustes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PREFS_CONFIG.map(({ key, title, description }) => (
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Atrás
        </Button>
        <Button onClick={handlePublish} size="lg" disabled={isPublishing}>
          {isPublishing ? "Finalizando..." : "Finalizar y publicar perfil"}
        </Button>
      </div>
    </div>
  );
};
