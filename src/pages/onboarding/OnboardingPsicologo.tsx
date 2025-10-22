import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingProvider, useOnboardingContext } from "@/hooks/useOnboarding";
import { Step1PersonalData } from "./Step1PersonalData";
import { Step2Experience } from "./Step2Experience";
import { Step3Documentation } from "./Step3Documentation";
import { Step4Availability } from "./Step4Availability";
import { Step5Pricing } from "./Step5Pricing";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validatePassword } from "@/lib/validation";

const RegistrationForm = () => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
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

    // Validate email
    if (!email.trim() || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Validate password confirmation
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Únete como Psicólogo</CardTitle>
          <CardDescription>
            Crea tu cuenta para comenzar el proceso de registro profesional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <p className="text-xs text-muted-foreground">
                Debe contener: 8+ caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&#)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Content = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading, currentStep, saveProgress } = useOnboardingContext();

  // Si no hay usuario autenticado, mostrar formulario de registro
  if (!authLoading && !user) {
    return <RegistrationForm />;
  }

  const handleSaveAndExit = async () => {
    await saveProgress(false);
    // No redirigir al dashboard, ir a home
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PersonalData />;
      case 2:
        return <Step2Experience />;
      case 3:
        return <Step3Documentation />;
      case 4:
        return <Step4Availability />;
      case 5:
        return <Step5Pricing />;
      default:
        return <Step1PersonalData />;
    }
  };

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={5} onSaveAndExit={handleSaveAndExit}>
      {renderStep()}
    </OnboardingLayout>
  );
};

export const OnboardingPsicologo = () => (
  <OnboardingProvider>
    <Content />
  </OnboardingProvider>
);

