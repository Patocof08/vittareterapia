import { useState } from "react";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Step5Pricing = () => {
  const { data, prevStep, nextStep, savePricing } = useOnboardingContext();

  // Calculate max price based on years of experience
  const getMaxPrice = () => {
    const years = data.years_experience || 0;
    if (years >= 1 && years < 3) return 700;
    if (years >= 3 && years < 5) return 1000;
    if (years >= 5) return 2000;
    return 700;
  };

  const maxPrice = getMaxPrice();
  const [sessionPrice, setSessionPrice] = useState(data.session_price || 0);
  const [isSaving, setIsSaving] = useState(false);

  const package4Price = Math.round(sessionPrice * 4 * 0.9);
  const package8Price = Math.round(sessionPrice * 8 * 0.85);

  const priceValid = sessionPrice >= 500 && sessionPrice <= maxPrice;

  const validateForm = () => {
    if (!sessionPrice || sessionPrice <= 0) {
      toast.error("El precio por sesión es obligatorio");
      return false;
    }
    if (sessionPrice < 500) {
      toast.error("El precio mínimo por sesión es $500 MXN");
      return false;
    }
    if (sessionPrice > maxPrice) {
      toast.error(`El precio máximo para tu experiencia es $${maxPrice} MXN`);
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await savePricing({
        session_price: sessionPrice,
        currency: "MXN",
        cancellation_policy: "Cancelación gratuita con 24 horas de anticipación",
        package_4_price: package4Price,
        package_8_price: package8Price,
        first_session_price: null,
        refund_policy: null,
        late_tolerance_minutes: 10,
      });
      await nextStep();
    } catch (error: any) {
      console.error("Error saving pricing:", error);
      toast.error("Error al guardar precios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1 pb-1">
        <h2 className="ob-heading text-2xl font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
          Establece tus honorarios
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          La plataforma retiene el 15% como comisión por servicio. Recibirás el 85% de cada sesión.
        </p>
      </div>

      {/* ── Price input ── */}
      <div className="ob-card p-6 space-y-5">
        <p className="ob-section-title">Precio por sesión individual</p>

        {/* Experience limit info */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--ob-chip-idle-bg)", border: "1px solid rgba(18,163,87,0.15)" }}
        >
          <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--ob-primary)" }} />
          <div>
            <span className="text-sm font-medium" style={{ color: "var(--ob-primary-dark)" }}>
              Límite con {data.years_experience || 0} años de experiencia:
            </span>
            <span
              className="ob-heading text-lg font-semibold ml-2"
              style={{ color: "var(--ob-primary)" }}
            >
              ${maxPrice} MXN
            </span>
          </div>
        </div>

        {/* Large price input */}
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center ob-heading text-xl font-semibold"
            style={{ background: "var(--ob-surface)", color: "var(--ob-muted)" }}
          >
            $
          </div>
          <input
            type="number"
            min={500}
            max={maxPrice}
            value={sessionPrice || ""}
            onChange={(e) => setSessionPrice(parseFloat(e.target.value) || 0)}
            placeholder="800"
            className="ob-input flex-1 text-center ob-heading font-semibold"
            style={{
              height: "3.5rem",
              fontSize: "1.75rem",
              background: priceValid && sessionPrice > 0
                ? "rgba(18,163,87,0.06)"
                : "var(--ob-surface)",
              borderColor: priceValid && sessionPrice > 0
                ? "rgba(18,163,87,0.3)"
                : "transparent",
            }}
          />
          <div
            className="flex-shrink-0 h-14 w-16 rounded-2xl flex items-center justify-center text-sm font-medium"
            style={{ background: "var(--ob-surface)", color: "var(--ob-muted)" }}
          >
            MXN
          </div>
        </div>

        <p className="text-xs text-center" style={{ color: "var(--ob-placeholder)" }}>
          Rango recomendado: $500 — ${maxPrice} MXN por sesión
        </p>

        {/* Inline validation */}
        {sessionPrice > 0 && sessionPrice < 500 && (
          <p className="text-sm" style={{ color: "#c0365c" }}>
            El precio mínimo por sesión es $500 MXN
          </p>
        )}
        {sessionPrice > maxPrice && (
          <p className="text-sm" style={{ color: "#c0365c" }}>
            El precio excede el máximo permitido para tu experiencia
          </p>
        )}
      </div>

      {/* ── Package pricing ── */}
      {sessionPrice >= 500 && (
        <div className="ob-card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <p className="ob-section-title">Paquetes calculados automáticamente</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: "Paquete de 4 sesiones",
                price: package4Price,
                discount: "10% dto.",
                original: sessionPrice * 4,
              },
              {
                label: "Paquete de 8 sesiones",
                price: package8Price,
                discount: "15% dto.",
                original: sessionPrice * 8,
              },
            ].map(({ label, price, discount, original }) => (
              <div
                key={label}
                className="rounded-xl p-4 space-y-1"
                style={{ background: "var(--ob-surface)", border: "1px solid var(--ob-border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "var(--ob-text)" }}>
                    {label}
                  </span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#ddf0e3", color: "#1F4D2E" }}
                  >
                    {discount}
                  </span>
                </div>
                <div
                  className="ob-heading text-xl font-semibold"
                  style={{ color: "var(--ob-primary-dark)" }}
                >
                  ${price.toLocaleString()} MXN
                </div>
                <div className="text-xs" style={{ color: "var(--ob-placeholder)" }}>
                  vs ${original.toLocaleString()} individualmente
                </div>
              </div>
            ))}
          </div>

          <div className="ob-info-box flex items-start gap-2">
            <span>💡</span>
            <span>
              Los paquetes aumentan tu tasa de conversión. Los clientes que compran paquetes tienen
              3× más retención.
            </span>
          </div>
        </div>
      )}

      {/* ── Profile summary ── */}
      <div
        className="ob-card p-6 space-y-4"
        style={{ border: "1.5px solid rgba(18,163,87,0.2)" }}
      >
        <p className="ob-section-title">Resumen de tu perfil</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ["Nombre", `${data.first_name || ""} ${data.last_name || ""}`],
            ["Experiencia", `${data.years_experience || 0} años`],
            ["Especialidades", data.specialties?.slice(0, 3).join(", ") || "—"],
            ["Precio por sesión", sessionPrice > 0 ? `$${sessionPrice} MXN` : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ color: "var(--ob-muted)" }}>{label}</p>
              <p className="font-medium mt-0.5" style={{ color: "var(--ob-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
        {data.bio_short && (
          <div
            className="pt-4 text-sm"
            style={{
              borderTop: "1px solid var(--ob-border)",
              color: "var(--ob-muted)",
            }}
          >
            <p className="font-medium mb-1" style={{ color: "var(--ob-text)" }}>
              Presentación breve:
            </p>
            <p className="leading-relaxed">{data.bio_short}</p>
          </div>
        )}

        {/* Cancellation policy */}
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{ background: "var(--ob-surface)", color: "var(--ob-muted)" }}
        >
          📋 Política de cancelación: Cancelación gratuita con 24 horas de anticipación
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2">
        <button onClick={prevStep} className="ob-btn-ghost flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={isSaving}
          className="ob-btn-primary flex items-center gap-2"
        >
          {isSaving ? "Guardando..." : "Continuar"}
          {!isSaving && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
