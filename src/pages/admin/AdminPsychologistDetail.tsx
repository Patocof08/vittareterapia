import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("psychologist_documents")
        .select("*")
        .eq("psychologist_id", id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc("approve_psychologist", {
        _psychologist_id: id,
        _admin_notes: null,
      });

      if (error) throw error;

      toast.success("Psicólogo aprobado exitosamente");
      fetchProfileDetails();
    } catch (error) {
      console.error("Error approving psychologist:", error);
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
      console.error("Error rejecting psychologist:", error);
      toast.error("Error al rechazar psicólogo");
    } finally {
      setActionLoading(false);
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
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
