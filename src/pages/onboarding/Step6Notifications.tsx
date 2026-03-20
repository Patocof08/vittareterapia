import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
  icon: string;
  title: string;
  description: string;
}> = [
  {
    key: "email_new_booking",
    icon: "📅",
    title: "Nuevas sesiones reservadas",
    description: "Cuando un cliente agende contigo",
  },
  {
    key: "email_session_reminder",
    icon: "⏰",
    title: "Recordatorios de sesiones",
    description: "24 horas antes de cada sesión",
  },
  {
    key: "email_new_message",
    icon: "💬",
    title: "Mensajes de clientes",
    description: "Cuando recibas un nuevo mensaje",
  },
  {
    key: "email_payment_update",
    icon: "💳",
    title: "Actualizaciones de pagos",
    description: "Pagos recibidos y transferencias",
  },
  {
    key: "email_cancellation",
    icon: "❌",
    title: "Cancelaciones",
    description: "Cuando un cliente cancele su sesión",
  },
  {
    key: "email_no_show",
    icon: "⚠️",
    title: "Inasistencias",
    description: "Cuando un cliente no se presente",
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
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1 pb-1">
        <h2 className="ob-heading text-2xl font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
          Preferencias de notificación
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          Elige cómo quieres recibir actualizaciones. Puedes cambiar esto en cualquier momento.
        </p>
      </div>

      {/* ── Notification toggles ── */}
      <div className="ob-card overflow-hidden">
        {PREFS_CONFIG.map(({ key, icon, title, description }, index) => (
          <div
            key={key}
            className="flex items-center justify-between px-6 py-4 transition-colors"
            style={{
              borderBottom:
                index < PREFS_CONFIG.length - 1 ? "1px solid var(--ob-border)" : "none",
              background:
                index % 2 === 0 ? "var(--ob-card)" : "rgba(249,250,245,0.5)",
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5 flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--ob-text)" }}>
                  {title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ob-placeholder)" }}>
                  {description}
                </p>
              </div>
            </div>

            {/* Custom toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))}
              className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
              style={{
                background: prefs[key] ? "var(--ob-primary)" : "var(--ob-border)",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{
                  transform: prefs[key] ? "translateX(1.25rem)" : "translateX(0)",
                }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* ── Completion preview ── */}
      <div
        className="ob-card p-6 text-center space-y-3"
        style={{ background: "linear-gradient(135deg, rgba(18,163,87,0.04) 0%, rgba(127,207,194,0.06) 100%)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "linear-gradient(135deg, #12A357, #1F4D2E)" }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="ob-heading text-lg font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
            ¡Ya casi terminas!
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--ob-muted)" }}>
            Al publicar tu perfil, nuestro equipo lo revisará en las próximas 24-48 horas hábiles.
            Recibirás un correo cuando sea aprobado.
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2">
        <button
          onClick={prevStep}
          disabled={isPublishing}
          className="ob-btn-ghost flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <motion.button
          onClick={handlePublish}
          disabled={isPublishing}
          className="ob-btn-primary flex items-center gap-2"
          style={{ height: "3rem", padding: "0 2rem", fontSize: "0.9375rem" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={
            !isPublishing
              ? {
                  boxShadow: [
                    "0 4px 14px rgba(18,163,87,0.28)",
                    "0 4px 24px rgba(18,163,87,0.45)",
                    "0 4px 14px rgba(18,163,87,0.28)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {isPublishing ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
              Publicando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Publicar mi perfil
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
