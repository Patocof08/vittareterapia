import { useState, useEffect } from "react";
import { FileText, Upload, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type DocumentType = Database["public"]["Enums"]["document_type"];
type DocumentInsert = Database["public"]["Tables"]["psychologist_documents"]["Insert"];

interface Document {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  url?: string;
  fileName?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

const documentTypes: Array<{
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}> = [
  {
    type: "license",
    label: "Cédula / Licencia profesional",
    description: "Documento oficial que acredita tu título profesional",
    required: true,
  },
  {
    type: "id",
    label: "Identificación oficial",
    description: "INE, pasaporte u otra identificación vigente",
    required: true,
  },
  {
    type: "certificate",
    label: "Certificados relevantes",
    description: "Diplomas de especialización o certificaciones relevantes",
    required: false,
  },
  {
    type: "address_proof",
    label: "Comprobante de domicilio",
    description: "Recibo de luz, agua o teléfono (no mayor a 3 meses)",
    required: false,
  },
];

export default function TherapistDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);

  useEffect(() => {
    loadPsychologistProfile();
  }, [user]);

  useEffect(() => {
    if (psychologistId) {
      loadDocuments();
    }
  }, [psychologistId]);

  const loadPsychologistProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setPsychologistId(data.id);
    } catch (error) {
      console.error("Error loading psychologist profile:", error);
      toast.error("Error al cargar el perfil");
    }
  };

  const loadDocuments = async () => {
    if (!psychologistId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("psychologist_documents")
        .select("*")
        .eq("psychologist_id", psychologistId);

      if (error) throw error;

      const docsWithUrls = await Promise.all(
        (data || []).map(async (doc) => {
          let url = null;
          if (doc.file_path) {
            const { data: urlData } = await supabase.storage
              .from("psychologist-files")
              .createSignedUrl(doc.file_path, 3600);
            url = urlData?.signedUrl;
          }

          return {
            id: doc.id,
            type: doc.document_type,
            status: doc.status,
            url,
            fileName: doc.file_name,
            uploadedAt: doc.uploaded_at,
            rejectionReason: doc.rejection_reason,
          };
        })
      );

      setDocuments(docsWithUrls);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: DocumentType, file: File) => {
    if (!psychologistId) {
      toast.error("No se encontró el perfil del psicólogo");
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${psychologistId}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("psychologist-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Delete existing document of this type if exists
      await supabase
        .from("psychologist_documents")
        .delete()
        .eq("psychologist_id", psychologistId)
        .eq("document_type", type);

      // Save document record
      const documentData: DocumentInsert = {
        psychologist_id: psychologistId,
        document_type: type,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: "pending",
      };

      const { error: dbError } = await supabase
        .from("psychologist_documents")
        .insert(documentData);

      if (dbError) throw dbError;

      toast.success("Documento subido correctamente");
      loadDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const getDocumentForType = (type: string) => {
    return documents.find((doc) => doc.type === type);
  };

  if (loading) {
    return <div className="p-6">Cargando documentos...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu verificación y documentación
        </p>
      </div>

      {/* Información de verificación */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Verificación de identidad (KYC)
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Para poder recibir pagos y aparecer en el directorio público, es
                necesario completar la verificación de tu identidad y documentos
                profesionales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos profesionales */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos profesionales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const doc = getDocumentForType(docType.type);

              return (
                <div
                  key={docType.type}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {docType.label}
                          {docType.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {doc && getStatusIcon(doc.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {docType.description}
                      </p>

                      {doc && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(doc.status)}
                          {doc.fileName && (
                            <span className="text-xs text-muted-foreground">
                              {doc.fileName}
                            </span>
                          )}
                          {doc.rejectionReason && (
                            <p className="text-xs text-red-500 w-full mt-1">
                              Razón de rechazo: {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {doc?.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={doc ? "outline" : "default"}
                        disabled={uploading}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,.jpg,.jpeg,.png";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) {
                              handleFileUpload(docType.type, file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {doc ? "Reemplazar" : "Subir"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
