import { useState } from "react";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Camera, Check, ChevronRight, ShieldCheck, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    selfie_verification_url: data.selfie_verification_url || "",
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
      handleChange("selfie_verification_url", url);
      toast.success("Selfie subida correctamente");
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
    if (!formData.profile_photo_url) {
      toast.error("La selfie de verificación es obligatoria");
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
          Cuéntanos sobre ti
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          Tu perfil es lo primero que verán tus futuros clientes.
        </p>
      </div>

      {/* ── Selfie / Identity verification ── */}
      <div
        className="ob-card p-6 space-y-4"
        style={{ border: "2px dashed rgba(18,163,87,0.25)" }}
      >
        <div className="flex items-center gap-2.5 justify-center">
          <ShieldCheck className="w-5 h-5" style={{ color: "var(--ob-primary)" }} />
          <h3 className="font-semibold text-base" style={{ color: "var(--ob-text)" }}>
            Verificación de identidad
          </h3>
        </div>

        <p className="text-sm text-center" style={{ color: "var(--ob-muted)" }}>
          Toma una selfie con tu cámara. Esta foto será tu imagen de perfil y se usará para
          verificar tu identidad.
        </p>

        <div className="flex flex-col items-center gap-4">
          {formData.profile_photo_url ? (
            <div className="relative">
              <Avatar className="w-36 h-36 ring-4 ring-green-100">
                <AvatarImage src={formData.profile_photo_url} className="object-cover" />
                <AvatarFallback>
                  <User className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5">
                <Check className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2"
              style={{
                background: "var(--ob-surface)",
                border: "2px dashed var(--ob-border)",
              }}
            >
              <Camera className="w-8 h-8" style={{ color: "var(--ob-placeholder)" }} />
              <span className="text-xs" style={{ color: "var(--ob-placeholder)" }}>
                Sin foto
              </span>
            </div>
          )}

          <input
            type="file"
            id="photo-upload"
            className="hidden"
            accept="image/*"
            capture="user"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("photo-upload")?.click()}
            disabled={uploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            {uploading
              ? "Subiendo..."
              : formData.profile_photo_url
              ? "Tomar otra selfie"
              : "Tomar selfie"}
          </Button>
        </div>

        <div
          className="rounded-lg p-3 space-y-1"
          style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <p className="text-xs font-medium" style={{ color: "#92400e" }}>
            Requisitos de la foto:
          </p>
          <ul className="text-xs space-y-0.5 list-disc list-inside" style={{ color: "#b45309" }}>
            <li>Rostro completamente visible, de frente</li>
            <li>Buena iluminación, sin filtros</li>
            <li>Sin lentes de sol ni accesorios que cubran el rostro</li>
            <li>Fondo neutro de preferencia</li>
          </ul>
        </div>

        {!formData.profile_photo_url && (
          <p className="text-sm text-center" style={{ color: "var(--ob-rose)" }}>
            La selfie de verificación es obligatoria para continuar
          </p>
        )}
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
