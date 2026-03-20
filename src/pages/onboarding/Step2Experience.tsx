import { useState } from "react";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
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
  "Ansiedad", "Depresión", "Terapia de Pareja", "Duelo",
  "TDAH", "Trauma", "Autoestima", "Estrés", "Adicciones", "Trastornos alimentarios",
];

const suggestedPopulations = [
  "Adultos", "Adolescentes", "Niños", "Parejas",
  "Familias", "Ejecutivos", "LGBTQ+", "Tercera edad",
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

  const toggleChip = (
    field: "therapeutic_approaches" | "specialties" | "populations",
    value: string
  ) => {
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
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1 pb-1">
        <h2 className="ob-heading text-2xl font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
          Tu experiencia profesional
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          Ayuda a los clientes a conocer tu formación y especialidades.
        </p>
      </div>

      {/* ── Years of experience ── */}
      <div className="ob-card p-6">
        <p className="ob-section-title mb-4">Años de experiencia *</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleChange("years_experience", Math.max(0, formData.years_experience - 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "var(--ob-surface)",
              border: "1.5px solid var(--ob-border)",
              color: "var(--ob-muted)",
            }}
          >
            <Minus className="w-4 h-4" />
          </button>

          <div
            className="flex-1 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--ob-chip-idle-bg)" }}
          >
            <span
              className="ob-heading text-3xl font-semibold"
              style={{ color: "var(--ob-primary-dark)" }}
            >
              {formData.years_experience}
            </span>
            <span className="text-sm ml-2" style={{ color: "var(--ob-muted)" }}>
              {formData.years_experience === 1 ? "año" : "años"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleChange("years_experience", Math.min(50, formData.years_experience + 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "var(--ob-primary)",
              color: "#fff",
            }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--ob-placeholder)" }}>
          Se actualizará automáticamente cada año.
        </p>
      </div>

      {/* ── Therapeutic approaches ── */}
      <div className="ob-card p-6 space-y-3">
        <p className="ob-section-title">Enfoques terapéuticos *</p>
        <p className="text-xs" style={{ color: "var(--ob-muted)" }}>Selecciona al menos uno</p>
        <div className="flex flex-wrap gap-2">
          {suggestedApproaches.map((approach) => (
            <button
              key={approach}
              type="button"
              onClick={() => toggleChip("therapeutic_approaches", approach)}
              className={
                formData.therapeutic_approaches.includes(approach)
                  ? "ob-chip-active"
                  : "ob-chip-idle"
              }
            >
              {approach}
            </button>
          ))}
        </div>
      </div>

      {/* ── Specialties ── */}
      <div className="ob-card p-6 space-y-3">
        <p className="ob-section-title">Especialidades *</p>
        <div className="flex flex-wrap gap-2">
          {suggestedSpecialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => toggleChip("specialties", specialty)}
              className={
                formData.specialties.includes(specialty) ? "ob-chip-active" : "ob-chip-idle"
              }
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>

      {/* ── Populations ── */}
      <div className="ob-card p-6 space-y-3">
        <p className="ob-section-title">Población que atiendes *</p>
        <div className="flex flex-wrap gap-2">
          {suggestedPopulations.map((pop) => (
            <button
              key={pop}
              type="button"
              onClick={() => toggleChip("populations", pop)}
              className={
                formData.populations.includes(pop) ? "ob-chip-active" : "ob-chip-idle"
              }
            >
              {pop}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bio ── */}
      <div className="ob-card p-6 space-y-5">
        <p className="ob-section-title">Presentación</p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="ob-label mb-0">Presentación breve *</label>
            <span
              className="text-xs"
              style={{
                color:
                  formData.bio_short.length > 380
                    ? "#e7839d"
                    : "var(--ob-placeholder)",
              }}
            >
              {formData.bio_short.length}/400
            </span>
          </div>
          <textarea
            className="ob-textarea"
            rows={3}
            value={formData.bio_short}
            onChange={(e) => handleChange("bio_short", e.target.value)}
            placeholder="Una breve descripción profesional que aparecerá en tu perfil..."
            maxLength={400}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="ob-label mb-0">Bio extendida</label>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--ob-surface)",
                  color: "var(--ob-muted)",
                }}
              >
                Opcional
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--ob-placeholder)" }}>
              {formData.bio_extended.length}/1200
            </span>
          </div>
          <textarea
            className="ob-textarea"
            rows={5}
            value={formData.bio_extended}
            onChange={(e) => handleChange("bio_extended", e.target.value)}
            placeholder="Describe tu filosofía de trabajo, logros destacados o información adicional relevante..."
            maxLength={1200}
          />
        </div>

        {/* Live preview */}
        {formData.bio_short && (
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--ob-surface)", borderLeft: "3px solid var(--ob-primary)" }}
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: "var(--ob-primary)" }}
            >
              Vista previa
            </p>
            <p className="text-sm" style={{ color: "var(--ob-text)" }}>
              {formData.bio_short}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-between pt-2">
        <button onClick={prevStep} className="ob-btn-ghost flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <button onClick={handleNext} className="ob-btn-primary flex items-center gap-2">
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
