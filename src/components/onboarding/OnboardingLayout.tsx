import { ReactNode, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Save, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onSaveAndExit: () => void;
}

const stepTitles = [
  "Datos personales",
  "Experiencia",
  "Documentación",
  "Disponibilidad",
  "Precios",
  "Notificaciones",
];

export const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  onSaveAndExit,
}: OnboardingLayoutProps) => {
  const navigate = useNavigate();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-[100dvh] ob-body" style={{ background: "var(--ob-bg)" }}>
      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(249,250,245,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(217,219,214,0.6)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate("/")}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ color: "var(--ob-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ob-surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                title="Ir al inicio"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className="ob-heading text-xl font-semibold italic"
                style={{ color: "var(--ob-primary-dark)" }}
              >
                Vittare
              </span>
            </div>

            {/* Save & Exit */}
            <button
              onClick={onSaveAndExit}
              className="flex items-center gap-1.5 text-sm transition-all ob-btn-ghost"
              style={{ height: "2.25rem", padding: "0 1rem" }}
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guardar y salir</span>
              <span className="sm:hidden">Salir</span>
            </button>
          </div>

          {/* ── Progress Bar ── */}
          <div className="pb-4 space-y-3">
            {/* Bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--ob-progress-track)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--ob-progress-fill)" }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              />
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-between">
              {stepTitles.map((title, index) => {
                const stepNum = index + 1;
                const isCompleted = stepNum < currentStep;
                const isActive = stepNum === currentStep;

                return (
                  <div key={index} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                      style={{
                        background: isCompleted || isActive
                          ? "var(--ob-primary)"
                          : "var(--ob-surface)",
                        color: isCompleted || isActive ? "#fff" : "var(--ob-placeholder)",
                        boxShadow: isActive
                          ? "0 0 0 3px rgba(18,163,87,0.18)"
                          : "none",
                        border: isCompleted || isActive
                          ? "none"
                          : "1.5px solid var(--ob-border)",
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span
                      className="text-[10px] hidden md:block transition-colors text-center leading-tight"
                      style={{
                        color: isActive
                          ? "var(--ob-primary-dark)"
                          : isCompleted
                          ? "var(--ob-primary)"
                          : "var(--ob-placeholder)",
                        fontWeight: isActive ? 600 : 400,
                        maxWidth: "4.5rem",
                      }}
                    >
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {children}
      </main>
    </div>
  );
};
