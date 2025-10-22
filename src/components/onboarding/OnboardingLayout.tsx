import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onSaveAndExit: () => void;
}

const stepTitles = [
  "Datos personales",
  "Experiencia profesional",
  "Documentación",
  "Disponibilidad",
  "Precios y publicación"
];

export const OnboardingLayout = ({ 
  children, 
  currentStep, 
  totalSteps,
  onSaveAndExit 
}: OnboardingLayoutProps) => {
  const navigate = useNavigate();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Vittare</h1>
                <p className="text-sm text-muted-foreground">
                  Configuración de perfil profesional
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onSaveAndExit}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar y salir
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Paso {currentStep} de {totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% completado
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between gap-2">
              {stepTitles.map((title, index) => (
                <div
                  key={index}
                  className={`flex-1 text-center ${
                    index + 1 === currentStep
                      ? "text-primary font-medium"
                      : index + 1 < currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="text-xs lg:text-sm">{title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
