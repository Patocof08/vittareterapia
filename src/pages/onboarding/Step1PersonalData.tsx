import { useState, useRef, useEffect, useCallback } from "react";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Camera, Check, ChevronRight, ShieldCheck, User, X, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const languages = ["Español", "Inglés", "Francés", "Alemán", "Portugués", "Italiano"];

// ── Camera capture modal ──────────────────────────────────────────
interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    // Stop any existing stream first
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError(
        err.name === "NotAllowedError"
          ? "Permiso de cámara denegado. Actívalo en la configuración de tu navegador."
          : "No se pudo acceder a la cámara."
      );
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontally when using front camera (selfie mode)
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
          streamRef.current?.getTracks().forEach((t) => t.stop());
          onCapture(file);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ fontFamily: "var(--ob-font-body)" }}>
      {/* Video preview */}
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Camera className="w-12 h-12 text-white/40" />
            <p className="text-white/80 text-sm">{error}</p>
            <button onClick={onClose} className="ob-btn-ghost text-white border-white/30" style={{ color: "#fff" }}>
              Cerrar
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={() => setReady(true)}
            className="w-full h-full object-cover"
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
        )}

        {/* Oval face guide */}
        {!error && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom: "10%" }}
          >
            <div
              className="rounded-full"
              style={{
                width: "min(56vw, 260px)",
                height: "min(72vw, 340px)",
                border: `3px solid rgba(127,207,194,${ready ? 0.85 : 0.35})`,
                boxShadow: ready ? "0 0 0 9999px rgba(0,0,0,0.45)" : "0 0 0 9999px rgba(0,0,0,0.65)",
                transition: "all 0.4s ease",
              }}
            />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Flip camera button */}
        {!error && (
          <button
            onClick={flipCamera}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        {/* Loading indicator */}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}
      </div>

      {/* Capture area */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-6 py-8 px-6"
        style={{ background: "rgba(0,0,0,0.85)" }}
      >
        <p className="text-white/60 text-sm flex-1 text-right hidden sm:block">
          Centra tu rostro en el óvalo
        </p>

        <button
          onClick={capturePhoto}
          disabled={!ready || !!error}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
          style={{
            background: ready ? "var(--ob-primary)" : "#555",
            boxShadow: ready ? "0 0 0 4px rgba(18,163,87,0.3)" : "none",
          }}
        >
          <Camera className="w-7 h-7 text-white" />
        </button>

        <div className="flex-1" />
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// ── Step 1 ────────────────────────────────────────────────────────
export const Step1PersonalData = () => {
  const { data, updateData, nextStep, uploadFile } = useOnboardingContext();
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

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

  const handleCapturedFile = async (file: File) => {
    setShowCamera(false);
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
    <>
      {/* Camera modal — rendered outside normal flow so it's truly fullscreen */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapturedFile}
          onClose={() => setShowCamera(false)}
        />
      )}

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
            {/* Avatar preview */}
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

            {/* Camera button */}
            <Button
              variant="outline"
              onClick={() => setShowCamera(true)}
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploading
                ? "Subiendo..."
                : formData.profile_photo_url
                ? "Tomar otra selfie"
                : "Abrir cámara"}
            </Button>
          </div>

          {/* Requirements */}
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
            <p className="text-sm text-center" style={{ color: "var(--ob-rose, #E7839D)" }}>
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
              <input className="ob-input" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} placeholder="Tu nombre" />
            </div>
            <div>
              <label className="ob-label">Apellidos *</label>
              <input className="ob-input" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} placeholder="Tus apellidos" />
            </div>
            <div>
              <label className="ob-label">Correo electrónico *</label>
              <input className="ob-input" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="ob-label">Teléfono *</label>
              <input className="ob-input" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+52 123 456 7890" style={{ fontSize: "1rem" }} />
            </div>
            <div>
              <label className="ob-label">Ciudad *</label>
              <input className="ob-input" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Ciudad de México" />
            </div>
            <div>
              <label className="ob-label">País *</label>
              <input className="ob-input" value={formData.country} onChange={(e) => handleChange("country", e.target.value)} placeholder="México" />
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
    </>
  );
};
