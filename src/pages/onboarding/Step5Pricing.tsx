import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const Step5Pricing = () => {
  const { data, prevStep, savePricing, publishProfile } = useOnboardingContext();
  const navigate = useNavigate();

  // Calculate max price based on years of experience
  const getMaxPrice = () => {
    const years = data.years_experience || 0;
    if (years >= 1 && years < 3) return 700;
    if (years >= 3 && years < 5) return 1000;
    if (years >= 5) return 2000;
    return 700; // default
  };

  const maxPrice = getMaxPrice();

  const [sessionPrice, setSessionPrice] = useState(data.session_price || 0);
  const [isPublishing, setIsPublishing] = useState(false);

  const validateForm = () => {
    if (!sessionPrice || sessionPrice <= 0) {
      toast.error("El precio por sesión es obligatorio");
      return false;
    }

    if (sessionPrice > maxPrice) {
      toast.error(`El precio máximo para tu experiencia es $${maxPrice} MXN`);
      return false;
    }

    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setIsPublishing(true);

    try {
      // Save pricing data
      await savePricing({
        session_price: sessionPrice,
        currency: "MXN",
        cancellation_policy: "Cancelación gratuita con 24 horas de anticipación",
        package_4_price: null,
        package_8_price: null,
        first_session_price: null,
        refund_policy: null,
        late_tolerance_minutes: 10,
      });

      // Publish profile (marca onboarding_step como 5)
      const success = await publishProfile();
      if (success) {
        // Redirigir a página de verificación pendiente
        navigate("/therapist/pending-verification");
      }
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast.error("Error al publicar perfil");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Precios y políticas</CardTitle>
          <CardDescription>
            Configura tus tarifas y políticas de servicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info about experience-based pricing */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">
              Límite de precio según tu experiencia ({data.years_experience || 0} años):
            </p>
            <p className="text-2xl font-bold text-primary">
              Hasta ${maxPrice} MXN por sesión
            </p>
            <p className="text-xs text-muted-foreground">
              {data.years_experience && data.years_experience >= 1 && data.years_experience < 3 && "1-3 años de experiencia"}
              {data.years_experience && data.years_experience >= 3 && data.years_experience < 5 && "3-5 años de experiencia"}
              {data.years_experience && data.years_experience >= 5 && "Más de 5 años de experiencia"}
            </p>
          </div>

          {/* Session Price */}
          <div className="space-y-2">
            <Label htmlFor="session_price">Precio por sesión individual *</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="session_price"
                type="number"
                min="0"
                max={maxPrice}
                value={sessionPrice}
                onChange={(e) => setSessionPrice(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-muted-foreground w-16">MXN</span>
            </div>
            {sessionPrice > maxPrice && (
              <p className="text-sm text-destructive">
                El precio excede el máximo permitido para tu experiencia
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Resumen del perfil</CardTitle>
          <CardDescription>
            Revisa la información antes de publicar tu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nombre:</p>
              <p className="font-medium">
                {data.first_name} {data.last_name}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Experiencia:</p>
              <p className="font-medium">{data.years_experience} años</p>
            </div>
            <div>
              <p className="text-muted-foreground">Especialidades:</p>
              <p className="font-medium">{data.specialties?.join(", ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Precio por sesión:</p>
              <p className="font-medium">
                ${sessionPrice} MXN
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Bio corta:</p>
            <p className="text-sm">{data.bio_short}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button onClick={handlePublish} size="lg" disabled={isPublishing}>
          {isPublishing ? "Publicando..." : "Finalizar registro"}
        </Button>
      </div>
    </div>
  );
};
