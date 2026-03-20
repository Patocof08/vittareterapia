import { useState } from "react";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Upload, User, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const languages = ["Español", "Inglés", "Francés", "Alemán", "Portugués", "Italiano"];

export const Step1PersonalData = () => {
  const { data, updateData, nextStep, uploadFile } = useOnboardingContext();
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    email: data.email || "",
    phone: data.phone || "",
    city: data.city || "",
    country: data.country || "",
    languages: data.languages || [],
    modalities: ["Videollamada"],
    profile_photo_url: data.profile_photo_url || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "languages" | "modalities", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }
    setUploading(true);
    const url = await uploadFile(file, "photo");
    if (url) {
      handleChange("profile_photo_url", url);
      toast.success("Foto subida correctamente");
    }
    setUploading(false);
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) { toast.error("El nombre es obligatorio"); return false; }
    if (!formData.last_name.trim()) { toast.error("Los apellidos son obligatorios"); return false; }
    if (!formData.email.trim() || !formData.email.includes("@")) { toast.error("Ingresa un email válido"); return false; }
    if (!formData.phone.trim()) { toast.error("El teléfono es obligatorio"); return false; }
    if (!formData.city.trim()) { toast.error("La ciudad es obligatoria"); return false; }
    if (!formData.country.trim()) { toast.error("El país es obligatorio"); return false; }
    if (formData.languages.length === 0) { toast.error("Selecciona al menos un idioma"); return false; }
    if (!formData.profile_photo_url) { toast.error("La foto de perfil es obligatoria"); return false; }
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
          Cuéntanos sobre ti
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          Tu perfil es lo primero que verán tus futuros clientes.
        </p>
      </div>

      {/* ── Photo upload ── */}
      <div className="ob-card p-6">
        <p className="ob-section-title mb-4">Foto de perfil</p>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar */}
          <div
            className="relative w-24 h-24 rounded-full flex-shrink-0 overflow-hidden"
            style={{
              background: formData.profile_photo_url ? "transparent" : "var(--ob-surface)",
              border: formData.profile_photo_url
                ? "3px solid var(--ob-primary)"
                : "2px dashed var(--ob-teal)",
            }}
          >
            {formData.profile_photo_url ? (
              <img
                src={formData.profile_photo_url}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10" style={{ color: "var(--ob-placeholder)" }} />
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-medium" style={{ color: "var(--ob-text)" }}>
              {formData.profile_photo_url ? "Foto cargada ✓" : "Sube tu foto profesional"}
            </p>
            <p className="text-xs" style={{ color: "var(--ob-placeholder)" }}>
              Imagen clara de tu rostro · Máx. 5 MB · JPG o PNG
            </p>
            <input
              type="file"
              id="photo-upload"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => document.getElementById("photo-upload")?.click()}
              disabled={uploading}
              className="ob-btn-ghost flex items-center gap-2 text-sm"
              style={{ height: "2.25rem", padding: "0 1rem", fontSize: "0.8125rem" }}
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Subiendo..." : formData.profile_photo_url ? "Cambiar foto" : "Subir foto"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className="ob-card p-6 space-y-5">
        <p className="ob-section-title">Información personal</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="ob-label">Nombre(s) *</label>
            <input
              className="ob-input"
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="ob-label">Apellidos *</label>
            <input
              className="ob-input"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              placeholder="Tus apellidos"
            />
          </div>
          <div>
            <label className="ob-label">Correo electrónico *</label>
            <input
              className="ob-input"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="ob-label">Teléfono *</label>
            <input
              className="ob-input"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+52 123 456 7890"
              style={{ fontSize: "1rem" }}
            />
          </div>
          <div>
            <label className="ob-label">Ciudad *</label>
            <input
              className="ob-input"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Ciudad de México"
            />
          </div>
          <div>
            <label className="ob-label">País *</label>
            <input
              className="ob-input"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="México"
            />
          </div>
        </div>
      </div>

      {/* ── Languages ── */}
      <div className="ob-card p-6 space-y-4">
        <p className="ob-section-title">Idiomas de atención *</p>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleArrayItem("languages", lang)}
              className={formData.languages.includes(lang) ? "ob-chip-active" : "ob-chip-idle"}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modality info ── */}
      <div className="ob-info-box flex items-center gap-2">
        <span className="text-base">💻</span>
        <span>Todas las sesiones se realizan por videollamada.</span>
      </div>

      {/* ── Navigation ── */}
      <div className="flex justify-end pt-2">
        <button onClick={handleNext} className="ob-btn-primary flex items-center gap-2">
          Continuar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
