import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Download,
  ShieldCheck,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Document preview helper ───────────────────────────────────────
const DocumentPreview = ({
  documents,
  type,
  onDownload,
}: {
  documents: any[];
  type: string;
  onDownload: (path: string, name: string) => void;
}) => {
  const doc = documents.find((d: any) => d.document_type === type);

  // Fallback: legacy "id" type when looking for id_front
  const legacyDoc =
    !doc && type === "id_front"
      ? documents.find((d: any) => d.document_type === "id")
      : null;

  const target = doc || legacyDoc;

  if (!target) {
    return (
      <div className="w-full aspect-[3/2] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No subido</p>
      </div>
    );
  }

  if (target.mime_type?.startsWith("image/") && target.viewUrl) {
    return (
      <div className="relative group cursor-pointer" onClick={() => onDownload(target.file_path, target.file_name)}>
        <img
          src={target.viewUrl}
          alt={target.file_name}
          className="w-full aspect-[3/2] object-cover rounded-lg border"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <p className="text-white text-xs font-medium">Descargar</p>
        </div>
        {legacyDoc && (
          <p className="text-xs text-muted-foreground mt-1 text-center">(tipo: id)</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full aspect-[3/2] bg-muted rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={() => onDownload(target.file_path, target.file_name)}
    >
      <FileText className="w-8 h-8 text-muted-foreground" />
      <p className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
        {target.file_name}
      </p>
      <p className="text-xs text-primary font-medium">Descargar</p>
    </div>
  );
};

export default function AdminPsychologistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (id) {
      fetchProfileDetails();
      fetchDocuments();
    }
  }, [id]);

  const fetchProfileDetails = async () => {
    try {
      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      logger.error("Error fetching profile:", error);
      toast.error("Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      // @ts-ignore - Types will regenerate automatically
      const { data, error } = await supabase
        .from("psychologist_documents")
        .select("*")
        .eq("psychologist_id", id);

      if (error) throw error;

      // Generate signed URLs for image preview
      const docsWithUrls = await Promise.all(
        (data || []).map(async (doc: any) => {
          if (doc.file_path && doc.mime_type?.startsWith("image/")) {
            const { data: signedData } = await supabase.storage
              .from("psychologist-files")
              .createSignedUrl(doc.file_path, 3600);
            return { ...doc, viewUrl: signedData?.signedUrl || null };
          }
          return { ...doc, viewUrl: null };
        })
      );
      setDocuments(docsWithUrls);
    } catch (error) {
      logger.error("Error fetching documents:", error);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      // @ts-ignore
      const { error } = await supabase
        .from("psychologist_profiles")
        .update({ identity_verified_at: new Date().toISOString(), identity_rejection_reason: null })
        .eq("id", id);
      if (error) throw error;
      toast.success("Identidad verificada correctamente");
      fetchProfileDetails();
    } catch (error) {
      logger.error("Error verifying identity:", error);
      toast.error("Error al verificar identidad");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectIdentity = async () => {
    const reason = window.prompt("Motivo del rechazo de identidad (el psicólogo deberá subir nueva selfie):");
    if (!reason) return;
    setActionLoading(true);
    try {
      // @ts-ignore
      const { error } = await supabase
        .from("psychologist_profiles")
        .update({
          identity_verified_at: null,
          identity_rejection_reason: reason,
          selfie_verification_url: null,
          profile_photo_url: null,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Identidad rechazada — el psicólogo deberá subir nueva selfie");
      fetchProfileDetails();
    } catch (error) {
      logger.error("Error rejecting identity:", error);
      toast.error("Error al rechazar identidad");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase.rpc("approve_psychologist", {
        _psychologist_id: id,
        _admin_notes: null,
      });

      if (error) throw error;

      toast.success("Psicólogo aprobado exitosamente");
      fetchProfileDetails();
    } catch (error) {
      logger.error("Error approving psychologist:", error);
      toast.error("Error al aprobar psicólogo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      toast.error("Debes proporcionar un motivo de rechazo");
      return;
    }

    setActionLoading(true);
    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase.rpc("reject_psychologist", {
        _psychologist_id: id,
        _rejection_reason: rejectionReason,
      });

      if (error) throw error;

      toast.success("Psicólogo rechazado");
      setShowRejectDialog(false);
      setRejectionReason("");
      fetchProfileDetails();
    } catch (error) {
      logger.error("Error rejecting psychologist:", error);
      toast.error("Error al rechazar psicólogo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("psychologist-files")
        .download(filePath);

      if (error) throw error;

      // Create a blob URL and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Documento descargado");
    } catch (error) {
      logger.error("Error downloading document:", error);
      toast.error("Error al descargar documento");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Aprobado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Perfil no encontrado</p>
        <Button onClick={() => navigate("/admin/verifications")} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/verifications")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">Detalle del psicólogo</p>
          </div>
        </div>
        {getStatusBadge(profile.verification_status)}
      </div>

      {profile.verification_status === "pending" && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Este perfil requiere tu aprobación
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-medium">
                    {profile.first_name} {profile.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profile.phone || "No proporcionado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.city}, {profile.country}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experiencia Profesional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Años de Experiencia</p>
                <p className="font-medium">{profile.years_experience} años</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties?.map((spec: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Enfoques Terapéuticos
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.therapeutic_approaches?.map((approach: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {approach}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biografía</p>
                <p className="text-sm mt-1">{profile.bio_short}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay documentos cargados
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.document_type} • {getStatusBadge(doc.status)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* ── Identity Verification Card ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Verificación de Identidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status banner */}
              {profile.identity_verified_at ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Identidad verificada el{" "}
                    {new Date(profile.identity_verified_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ) : profile.identity_rejection_reason ? (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg space-y-1">
                  <p className="text-sm font-medium text-red-800">Identidad rechazada</p>
                  <p className="text-sm text-red-700">{profile.identity_rejection_reason}</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">Pendiente de verificación</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Compara la selfie con el INE para verificar la identidad del psicólogo.
                  </p>
                </div>
              )}

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selfie */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Selfie de verificación</p>
                  {profile.selfie_verification_url ? (
                    <img
                      src={profile.selfie_verification_url}
                      alt="Selfie de verificación"
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Sin selfie</p>
                    </div>
                  )}
                </div>

                {/* INE front */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">INE (frente)</p>
                  <DocumentPreview
                    documents={documents}
                    type="id_front"
                    onDownload={handleDownloadDocument}
                  />
                </div>

                {/* INE back */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">INE (reverso)</p>
                  <DocumentPreview
                    documents={documents}
                    type="id_back"
                    onDownload={handleDownloadDocument}
                  />
                </div>
              </div>

              {/* Action buttons — only show when selfie present and not yet verified */}
              {!profile.identity_verified_at && profile.selfie_verification_url && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRejectIdentity}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar identidad
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleVerifyIdentity}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Identidad verificada
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Estado de Verificación</p>
                <div className="mt-1">{getStatusBadge(profile.verification_status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(profile.created_at).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Publicado</p>
                <p className="font-medium">
                  {profile.is_published ? "Sí" : "No"}
                </p>
              </div>
            </CardContent>
          </Card>

          {profile.verification_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas de Verificación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{profile.verification_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Psicólogo</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor proporciona un motivo detallado del rechazo. Esta información
              será visible para el psicólogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
