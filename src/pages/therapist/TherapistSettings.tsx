import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, User, Shield, FileText, CreditCard, Bell, AlertTriangle, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/lib/logger";
import { Database } from "@/integrations/supabase/types";

type DocumentType = Database["public"]["Enums"]["document_type"];
type DocumentInsert = Database["public"]["Tables"]["psychologist_documents"]["Insert"];

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio_short: string;
  bio_extended: string;
  years_experience: number;
  specialties: string[];
  therapeutic_approaches: string[];
  languages: string[];
  populations: string[];
  modalities: string[];
  profile_photo_url: string | null;
  verification_status: string;
}

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

export default function TherapistSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (psychologistId) {
      loadDocuments();
    }
  }, [psychologistId]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("psychologist_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(data as ProfileData);
        setPsychologistId(data.id);
      }
    } catch (error) {
      logger.error("Error loading profile:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!psychologistId) return;

    try {
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
      logger.error("Error loading documents:", error);
      toast.error("Error al cargar los documentos");
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !profileData) return;

    try {
      const { error } = await supabase
        .from("psychologist_profiles")
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone: profileData.phone,
          bio_short: profileData.bio_short,
          bio_extended: profileData.bio_extended,
          specialties: profileData.specialties,
          therapeutic_approaches: profileData.therapeutic_approaches,
          languages: profileData.languages,
          populations: profileData.populations,
          modalities: profileData.modalities,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      logger.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user || !psychologistId) return;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${psychologistId}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("psychologist_profiles")
        .update({ profile_photo_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Foto de perfil actualizada");
      loadProfile();
      setAvatarFile(null);
    } catch (error) {
      logger.error("Error uploading avatar:", error);
      toast.error("Error al subir la foto");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Contraseña actualizada correctamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      logger.error("Error changing password:", error);
      toast.error("Error al cambiar la contraseña");
    }
  };

  const handleFileUpload = async (type: DocumentType, file: File) => {
    if (!psychologistId) {
      toast.error("No se encontró el perfil del psicólogo");
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const filePath = `${psychologistId}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("psychologist-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      await supabase
        .from("psychologist_documents")
        .delete()
        .eq("psychologist_id", psychologistId)
        .eq("document_type", type);

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
      logger.error("Error uploading document:", error);
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
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ajustes</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu perfil y preferencias
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="delete">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Eliminar
          </TabsTrigger>
        </TabsList>

        {/* Mi Perfil Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu información básica y foto de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={profileData?.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="avatar">Foto de perfil</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                  {avatarFile && (
                    <Button onClick={handleAvatarUpload} className="mt-2" size="sm">
                      Subir foto
                    </Button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={profileData?.first_name || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData!, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input
                    value={profileData?.last_name || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData!, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profileData?.email || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData!, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={profileData?.phone || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData!, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Biografía corta</Label>
                <Textarea
                  value={profileData?.bio_short || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData!, bio_short: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label>Biografía extendida</Label>
                <Textarea
                  value={profileData?.bio_extended || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData!, bio_extended: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div>
                <Label>Especialidades (separadas por coma)</Label>
                <Input
                  value={profileData?.specialties?.join(", ") || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData!,
                      specialties: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>

              <div>
                <Label>Enfoques terapéuticos (separados por coma)</Label>
                <Input
                  value={profileData?.therapeutic_approaches?.join(", ") || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData!,
                      therapeutic_approaches: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>

              <div>
                <Label>Idiomas (separados por coma)</Label>
                <Input
                  value={profileData?.languages?.join(", ") || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData!,
                      languages: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>

              <Button onClick={handleProfileUpdate}>Guardar cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguridad Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña regularmente para mayor seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nueva Contraseña</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Confirmar Nueva Contraseña</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </div>
              <Button onClick={handlePasswordChange}>Actualizar Contraseña</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos Tab */}
        <TabsContent value="documents" className="space-y-6">
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
        </TabsContent>

        {/* Métodos de Pago Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cuenta Bancaria</CardTitle>
              <CardDescription>Configura tu cuenta para recibir pagos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Banco</Label>
                <Input placeholder="Nombre del banco" />
              </div>
              <div>
                <Label>CLABE</Label>
                <Input placeholder="18 dígitos" />
              </div>
              <div>
                <Label>Titular de la cuenta</Label>
                <Input placeholder="Nombre completo" />
              </div>
              <Button>Guardar información bancaria</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaciones Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Controla cómo y cuándo recibes notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nuevas sesiones reservadas</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe un email cuando un cliente reserve una sesión
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de sesiones</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe recordatorios 24 horas antes de cada sesión
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mensajes de clientes</p>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones cuando recibas mensajes nuevos
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Actualizaciones de pagos</p>
                  <p className="text-sm text-muted-foreground">
                    Avisos sobre pagos recibidos y transferencias
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eliminar Cuenta Tab */}
        <TabsContent value="delete" className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta acción es permanente y no se puede deshacer. Todos tus datos serán eliminados.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Eliminar Cuenta</CardTitle>
              <CardDescription>
                Elimina permanentemente tu cuenta y todos tus datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Antes de eliminar tu cuenta, considera:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Perderás acceso a todos tus datos</li>
                <li>Tus sesiones programadas serán canceladas</li>
                <li>Los clientes ya no podrán encontrarte en el directorio</li>
                <li>Esta acción no se puede deshacer</li>
              </ul>
              <Button variant="destructive">Eliminar mi cuenta</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
