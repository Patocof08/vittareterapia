import { useState, useEffect } from "react";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import {
  Upload, FileText, CheckCircle, XCircle, Clock,
  Lock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
  rejection_reason?: string;
}

const documentTypes = [
  {
    type: "license",
    label: "Cédula profesional",
    required: true,
    description: "Tu cédula profesional de psicología emitida por la SEP",
  },
  {
    type: "id",
    label: "INE / Identificación oficial",
    required: true,
    description: "Foto clara del frente de tu INE o pasaporte",
  },
];

export const Step3Documentation = () => {
  const { data, updateData, nextStep, prevStep, uploadDocument, profileId } = useOnboardingContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(data.terms_accepted || false);
  const [emergencyDisclaimer, setEmergencyDisclaimer] = useState(
    data.emergency_disclaimer_accepted || false
  );

  useEffect(() => {
    loadDocuments();
  }, [profileId]);

  const loadDocuments = async () => {
    if (!profileId) return;
    try {
      const { data: docs, error } = await supabase
        .from("psychologist_documents")
        .select("*")
        .eq("psychologist_id", profileId);
      if (error) throw error;
      if (docs) {
        const documentsWithUrls = await Promise.all(
          docs.map(async (doc) => {
            if (doc.file_path) {
              const { data: signedData } = await supabase.storage
                .from("psychologist-files")
                .createSignedUrl(doc.file_path, 3600);
              return { ...doc, viewUrl: signedData?.signedUrl || null };
            }
            return doc;
          })
        );
        setDocuments(documentsWithUrls as any);
      }
    } catch (error: any) {
      console.error("Error loading documents:", error);
    }
  };

  const handleFileUpload = async (file: File, docType: string) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Solo se permiten archivos PDF, JPG o PNG");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar 10MB");
      return;
    }
    setUploading(docType);
    try {
      await uploadDocument(file, docType);
      await loadDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir el documento");
    } finally {
      setUploading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="w-4 h-4" style={{ color: "#12A357" }} />;
    if (status === "rejected") return <XCircle className="w-4 h-4" style={{ color: "#e7839d" }} />;
    return <Clock className="w-4 h-4" style={{ color: "#f5c243" }} />;
  };

  const getStatusLabel = (status: string) => {
    if (status === "approved") return { label: "Aprobado", color: "#12A357", bg: "#ddf0e3" };
    if (status === "rejected") return { label: "Rechazado", color: "#c0365c", bg: "#fce7ed" };
    return { label: "Pendiente", color: "#92620a", bg: "#fef3c7" };
  };

  const getDocumentForType = (type: string) => documents.find((doc) => doc.document_type === type);

  const validateForm = () => {
    const requiredDocs = documentTypes.filter((dt) => dt.required);
    for (const docType of requiredDocs) {
      const doc = getDocumentForType(docType.type);
      if (!doc) { toast.error(`Debes subir: ${docType.label}`); return false; }
      if (doc.status === "rejected") {
        toast.error(`El documento "${docType.label}" fue rechazado. Por favor, vuelve a subirlo.`);
        return false;
      }
    }
    if (!termsAccepted) { toast.error("Debes aceptar los Términos y Condiciones"); return false; }
    if (!emergencyDisclaimer) { toast.error("Debes reconocer el aviso de emergencias"); return false; }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    updateData({ terms_accepted: termsAccepted, emergency_disclaimer_accepted: emergencyDisclaimer });
    nextStep();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1 pb-1">
        <h2 className="ob-heading text-2xl font-semibold" style={{ color: "var(--ob-primary-dark)" }}>
          Documentación y verificación
        </h2>
        <p className="text-sm" style={{ color: "var(--ob-muted)" }}>
          Tu privacidad es nuestra prioridad. Los documentos son revisados únicamente por nuestro
          equipo para comparar con tu selfie de verificación.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="ob-info-box flex items-start gap-2.5">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--ob-teal)" }} />
        <span>
          Tus archivos están protegidos con cifrado de extremo a extremo y no se mostrarán en tu
          perfil público.
        </span>
      </div>

      {/* ── Document cards ── */}
      <div className="ob-card p-6 space-y-4">
        <p className="ob-section-title mb-2">Documentos requeridos</p>

        {documentTypes.map((docType) => {
          const doc = getDocumentForType(docType.type);
          const statusMeta = doc ? getStatusLabel(doc.status) : null;

          return (
            <div
              key={docType.type}
              className="rounded-xl p-4 transition-all"
              style={{
                background: doc ? "var(--ob-surface)" : "var(--ob-card)",
                border: `1.5px ${doc ? "solid" : "dashed"} ${
                  doc ? "var(--ob-border)" : "rgba(127,207,194,0.5)"
                }`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: "var(--ob-text)" }}>
                      {docType.label}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "#fce7ed", color: "#c0365c" }}
                    >
                      REQUERIDO
                    </span>
                  </div>

                  {docType.description && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--ob-placeholder)" }}>
                      {docType.description}
                    </p>
                  )}

                  {doc && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <FileText className="w-3.5 h-3.5" style={{ color: "var(--ob-placeholder)" }} />
                        <span className="text-xs truncate" style={{ color: "var(--ob-muted)" }}>
                          {doc.file_name}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: statusMeta!.bg, color: statusMeta!.color }}
                        >
                          {statusMeta!.label}
                        </span>
                      </div>
                      {doc.status === "rejected" && doc.rejection_reason && (
                        <p className="text-xs" style={{ color: "#c0365c" }}>
                          Motivo: {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {!doc && (
                    <p className="text-xs mt-1" style={{ color: "var(--ob-placeholder)" }}>
                      PDF, JPG o PNG · Máx. 10 MB
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <input
                    type="file"
                    id={`file-${docType.type}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, docType.type);
                    }}
                    disabled={uploading === docType.type}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`file-${docType.type}`)?.click()}
                    disabled={uploading === docType.type}
                    className="ob-btn-ghost flex items-center gap-1.5"
                    style={{ height: "2.25rem", padding: "0 0.875rem", fontSize: "0.8125rem" }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === docType.type ? "Subiendo..." : doc ? "Reemplazar" : "Subir"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Legal checkboxes ── */}
      <div className="ob-card p-6 space-y-4">
        <p className="ob-section-title">Acuerdos legales</p>

        {[
          {
            id: "terms",
            checked: termsAccepted,
            onChange: setTermsAccepted,
            label: (
              <>
                Acepto los{" "}
                <a href="/terms" target="_blank" className="underline" style={{ color: "var(--ob-primary)" }}>
                  Términos de Servicio
                </a>{" "}
                y la{" "}
                <a href="/privacy" target="_blank" className="underline" style={{ color: "var(--ob-primary)" }}>
                  Política de Privacidad
                </a>{" "}
                de Vittare
              </>
            ),
          },
          {
            id: "emergency",
            checked: emergencyDisclaimer,
            onChange: setEmergencyDisclaimer,
            label:
              "Entiendo que esta plataforma no es un servicio de emergencias y orientaré a clientes en crisis a líneas especializadas",
          },
        ].map(({ id, checked, onChange, label }) => (
          <label key={id} htmlFor={id} className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={{
                  background: checked ? "var(--ob-primary)" : "var(--ob-surface)",
                  border: checked ? "none" : "1.5px solid var(--ob-border)",
                }}
              >
                {checked && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm leading-relaxed" style={{ color: "var(--ob-text)" }}>
              {label}
            </span>
          </label>
        ))}
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
