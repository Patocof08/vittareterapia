import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { X } from "lucide-react";
import { toast } from "sonner";

const suggestedApproaches = [
  "Terapia Cognitivo-Conductual (TCC)",
  "Terapia de Aceptación y Compromiso (ACT)",
  "Terapia Sistémica",
  "Psicoanálisis",
  "Terapia Humanista",
  "Mindfulness",
  "EMDR",
  "Terapia Gestalt",
];

const suggestedSpecialties = [
  "Ansiedad",
  "Depresión",
  "Terapia de Pareja",
  "Duelo",
  "TDAH",
  "Trauma",
  "Autoestima",
  "Estrés",
  "Adicciones",
  "Trastornos alimentarios",
];

const suggestedPopulations = [
  "Adultos",
  "Adolescentes",
  "Niños",
  "Parejas",
  "Familias",
  "Ejecutivos",
  "LGBTQ+",
  "Tercera edad",
];

export const Step2Experience = () => {
  const { data, updateData, nextStep, prevStep } = useOnboardingContext();

  const [formData, setFormData] = useState({
    years_experience: data.years_experience || 0,
    therapeutic_approaches: data.therapeutic_approaches || [],
    specialties: data.specialties || [],
    populations: data.populations || [],
    bio_short: data.bio_short || "",
    bio_extended: data.bio_extended || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChip = (field: "therapeutic_approaches" | "specialties" | "populations", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const validateForm = () => {
    if (formData.years_experience < 0 || formData.years_experience > 50) {
      toast.error("Los años de experiencia deben estar entre 0 y 50");
      return false;
    }
    if (formData.therapeutic_approaches.length === 0) {
      toast.error("Selecciona al menos un enfoque terapéutico");
      return false;
    }
    if (formData.specialties.length === 0) {
      toast.error("Selecciona al menos una especialidad");
      return false;
    }
    if (formData.populations.length === 0) {
      toast.error("Selecciona al menos una población");
      return false;
    }
    if (!formData.bio_short.trim() || formData.bio_short.length > 400) {
      toast.error("La bio corta es obligatoria y debe tener máximo 400 caracteres");
      return false;
    }
    if (formData.bio_extended && formData.bio_extended.length > 1200) {
      toast.error("La bio extendida debe tener máximo 1200 caracteres");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    updateData(formData);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Experiencia y enfoques terapéuticos</CardTitle>
          <CardDescription>
            Cuéntanos sobre tu experiencia profesional y áreas de especialización.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Years of Experience */}
          <div className="space-y-2">
            <Label htmlFor="years_experience">Años de experiencia *</Label>
            <Input
              id="years_experience"
              type="number"
              min="0"
              max="50"
              value={formData.years_experience}
              onChange={(e) => handleChange("years_experience", parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Nota: Una vez establecida, la experiencia se actualizará automáticamente cada año
            </p>
          </div>

          {/* Therapeutic Approaches */}
          <div className="space-y-3">
            <Label>Enfoques terapéuticos *</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedApproaches.map((approach) => (
                <Badge
                  key={approach}
                  variant={formData.therapeutic_approaches.includes(approach) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleChip("therapeutic_approaches", approach)}
                >
                  {approach}
                  {formData.therapeutic_approaches.includes(approach) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-3">
            <Label>Especialidades *</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedSpecialties.map((specialty) => (
                <Badge
                  key={specialty}
                  variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleChip("specialties", specialty)}
                >
                  {specialty}
                  {formData.specialties.includes(specialty) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Populations */}
          <div className="space-y-3">
            <Label>Poblaciones que atiendes *</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedPopulations.map((pop) => (
                <Badge
                  key={pop}
                  variant={formData.populations.includes(pop) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleChip("populations", pop)}
                >
                  {pop}
                  {formData.populations.includes(pop) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Bio Short */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="bio_short">Bio corta *</Label>
              <span className="text-sm text-muted-foreground">
                {formData.bio_short.length}/400
              </span>
            </div>
            <Textarea
              id="bio_short"
              value={formData.bio_short}
              onChange={(e) => handleChange("bio_short", e.target.value)}
              placeholder="Una breve descripción profesional que aparecerá en tu perfil..."
              maxLength={400}
              rows={3}
            />
          </div>

          {/* Bio Extended */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="bio_extended">Bio extendida (opcional)</Label>
              <span className="text-sm text-muted-foreground">
                {formData.bio_extended.length}/1200
              </span>
            </div>
            <Textarea
              id="bio_extended"
              value={formData.bio_extended}
              onChange={(e) => handleChange("bio_extended", e.target.value)}
              placeholder="Describe tu filosofía de trabajo, logros destacados, o cualquier información adicional relevante..."
              maxLength={1200}
              rows={6}
            />
          </div>

          {/* Preview */}
          {formData.bio_short && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Vista previa del perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formData.bio_short}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button onClick={handleNext}>Siguiente</Button>
      </div>
    </div>
  );
};
