import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingProvider, useOnboardingContext } from "@/hooks/useOnboarding";
import { Step1PersonalData } from "./Step1PersonalData";
import { Step2Experience } from "./Step2Experience";
import { Step3Documentation } from "./Step3Documentation";
import { Step4Availability } from "./Step4Availability";
import { Step5Pricing } from "./Step5Pricing";
import { Step6Notifications } from "./Step6Notifications";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { validatePassword } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

// ── Registration Form ─────────────────────────────────────────────
const RegistrationForm = () => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("El nombre completo es obligatorio");
      return;
    }
    if (fullName.trim().length < 2 || fullName.trim().length > 200) {
      toast.error("El nombre debe tener entre 2 y 200 caracteres");
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(fullName.trim())) {
      toast.error("El nombre solo puede contener letras");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim(), "psicologo");
      toast.success("Cuenta creada exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex"
      style={{ background: "var(--ob-bg)", fontFamily: "var(--ob-font-body)" }}
    >
      {/* ── Left brand panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[42%] shrink-0"
        style={{ background: "linear-gradient(160deg, #1F4D2E 0%, #12A357 100%)" }}
      >
        {/* Logo */}
        <div>
          <span
            className="text-3xl font-semibold italic"
            style={{ fontFamily: "var(--ob-font-display)", color: "#fff" }}
          >
            Vittare
          </span>
        </div>

        {/* Centre copy */}
        <div className="space-y-6">
          <h2
            className="text-4xl font-semibold leading-tight"
            style={{ fontFamily: "var(--ob-font-display)", color: "#fff" }}
          >
            Conecta con quienes más te necesitan
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            Únete a la red de psicólogos verificados más grande de Latinoamérica y comienza a
            transformar vidas desde cualquier lugar.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              ["+2,400", "psicólogos verificados"],
              ["98%", "satisfacción de clientes"],
            ].map(([num, label]) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#fff", fontFamily: "var(--ob-font-display)" }}
                >
                  {num}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative leaf shape */}
        <div>
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none" opacity="0.18">
            <ellipse cx="40" cy="40" rx="38" ry="22" transform="rotate(-30 40 40)" fill="#7FCFC2" />
            <ellipse cx="80" cy="50" rx="30" ry="16" transform="rotate(20 80 50)" fill="#BFE9E2" />
          </svg>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-2">
            <span
              className="text-2xl font-semibold italic"
              style={{ fontFamily: "var(--ob-font-display)", color: "var(--ob-primary-dark)" }}
            >
              Vittare
            </span>
          </div>

          <div className="space-y-1">
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--ob-font-display)", color: "var(--ob-primary-dark)" }}
            >
              Crea tu cuenta
            </h1>
            <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
              Únete como psicólogo verificado
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label className="ob-label">Nombre completo</label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ob-placeholder)" }}
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="ob-input pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="ob-label">Correo electrónico</label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ob-placeholder)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="ob-input pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="ob-label">Contraseña</label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ob-placeholder)" }}
                />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="ob-input pl-10 pr-10"
                  style={{ fontSize: "1rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ob-placeholder)" }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--ob-placeholder)" }}>
                8+ caracteres, mayúscula, número y símbolo (@$!%*?&#)
              </p>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="ob-label">Confirmar contraseña</label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--ob-placeholder)" }}
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="ob-input pl-10 pr-10"
                  style={{ fontSize: "1rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ob-placeholder)" }}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ob-btn-primary w-full"
              style={{ height: "3rem" }}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta →"}
            </button>
          </form>

          <p className="text-xs text-center" style={{ color: "var(--ob-placeholder)" }}>
            Al crear cuenta aceptas los{" "}
            <a href="/terms" className="underline" style={{ color: "var(--ob-muted)" }}>
              Términos
            </a>{" "}
            y la{" "}
            <a href="/privacy" className="underline" style={{ color: "var(--ob-muted)" }}>
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Step transitions ──────────────────────────────────────────────
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -48 : 48,
    transition: { duration: 0.2 },
  }),
};

// ── Main Content ──────────────────────────────────────────────────
const Content = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading, currentStep, saveProgress } = useOnboardingContext();
  const [direction, setDirection] = useState(1);
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (currentStep > prevStepRef.current) setDirection(1);
    else if (currentStep < prevStepRef.current) setDirection(-1);
    prevStepRef.current = currentStep;
  }, [currentStep]);

  if (!authLoading && !user) return <RegistrationForm />;

  const handleSaveAndExit = async () => {
    await saveProgress(false);
    navigate("/");
  };

  if (loading) {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--ob-bg)" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--ob-primary)", borderTopColor: "transparent" }}
        />
        <p className="text-sm ob-body" style={{ color: "var(--ob-muted)" }}>
          Cargando tu perfil...
        </p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1PersonalData />;
      case 2: return <Step2Experience />;
      case 3: return <Step3Documentation />;
      case 4: return <Step4Availability />;
      case 5: return <Step5Pricing />;
      case 6: return <Step6Notifications />;
      default: return <Step1PersonalData />;
    }
  };

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={6} onSaveAndExit={handleSaveAndExit}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
};

export const OnboardingPsicologo = () => (
  <OnboardingProvider>
    <Content />
  </OnboardingProvider>
);
