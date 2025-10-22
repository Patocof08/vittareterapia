import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnboardingContext } from "@/hooks/useOnboarding";
import { Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
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
  { type: "license", label: "Cédula / Licencia profesional", required: true },
  { type: "id", label: "Identificación oficial", required: true },
  { type: "certificate", label: "Certificados relevantes", required: false },
  { type: "address_proof", label: "Comprobante de domicilio", required: false },
];

export const Step3Documentation = () => {
  const { data, updateData, nextStep, prevStep, uploadDocument, profileId } = useOnboardingContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(data.terms_accepted || false);
  const [emergencyDisclaimer, setEmergencyDisclaimer] = useState(data.emergency_disclaimer_accepted || false);

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
      
      // Generate signed URLs for viewing (1 hour expiry)
      if (docs) {
        const documentsWithUrls = await Promise.all(
          docs.map(async (doc) => {
            if (doc.file_path) {
              const { data: signedData } = await supabase.storage
                .from('psychologist-files')
                .createSignedUrl(doc.file_path, 3600); // 1 hour for viewing
              
              return {
                ...doc,
                viewUrl: signedData?.signedUrl || null
              };
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
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const getDocumentForType = (type: string) => {
    return documents.find((doc) => doc.document_type === type);
  };

  const validateForm = () => {
    const requiredDocs = documentTypes.filter((dt) => dt.required);
    for (const docType of requiredDocs) {
      const doc = getDocumentForType(docType.type);
      if (!doc) {
        toast.error(`Debes subir: ${docType.label}`);
        return false;
      }
      if (doc.status === "rejected") {
        toast.error(`El documento "${docType.label}" fue rechazado. Por favor, vuelve a subirlo.`);
        return false;
      }
    }

    if (!termsAccepted) {
      toast.error("Debes aceptar los Términos y Condiciones");
      return false;
    }

    if (!emergencyDisclaimer) {
      toast.error("Debes reconocer el aviso de emergencias");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    updateData({ 
      terms_accepted: termsAccepted,
      emergency_disclaimer_accepted: emergencyDisclaimer 
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documentación y cumplimiento</CardTitle>
          <CardDescription>
            Sube los documentos necesarios para verificar tu identidad profesional.
            Solo el equipo de verificación podrá verlos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {documentTypes.map((docType) => {
            const doc = getDocumentForType(docType.type);
            
            return (
              <div key={docType.type} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base">
                        {docType.label}
                        {docType.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {doc && getStatusIcon(doc.status)}
                    </div>
                    {doc && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{doc.file_name}</span>
                          {getStatusBadge(doc.status)}
                        </div>
                        {doc.status === "rejected" && doc.rejection_reason && (
                          <p className="text-sm text-destructive">
                            Motivo: {doc.rejection_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`file-${docType.type}`)?.click()}
                      disabled={uploading === docType.type}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading === docType.type
                        ? "Subiendo..."
                        : doc
                        ? "Reemplazar"
                        : "Subir"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Terms and Conditions */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label htmlFor="terms" className="cursor-pointer font-normal">
                Acepto los{" "}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Términos y Condiciones
                </a>{" "}
                y el{" "}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Aviso de Privacidad
                </a>{" "}
                *
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="emergency"
                checked={emergencyDisclaimer}
                onCheckedChange={(checked) => setEmergencyDisclaimer(checked as boolean)}
              />
              <Label htmlFor="emergency" className="cursor-pointer font-normal">
                Reconozco que esta plataforma no es para emergencias. En caso de crisis, contactar
                líneas de ayuda especializadas *
              </Label>
            </div>
          </div>

          {/* Privacy Notice */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                🔒 Tus documentos están protegidos y solo son visibles para el equipo de
                verificación. No se mostrarán públicamente en tu perfil.
              </p>
            </CardContent>
          </Card>
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
