import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload, User, Shield, FileText, CreditCard, Bell, AlertTriangle, CheckCircle2, XCircle, Clock, Eye, X as XIcon } from "lucide-react";
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
  city: string;
  country: string;
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
  session_price: number;
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

const languages = ["Español", "Inglés", "Francés", "Alemán", "Portugués", "Italiano"];
const modalities = ["Videollamada", "Presencial"];

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

// Calculate max price based on years of experience
const getMaxPrice = (yearsExperience: number) => {
  if (yearsExperience >= 1 && yearsExperience < 3) return 700;
  if (yearsExperience >= 3 && yearsExperience < 5) return 1000;
  if (yearsExperience >= 5) return 2000;
  return 700; // default
};

const suggestedSpecialties = [
  "Ansiedad",
  "Depresión",
  "Terapia de Pareja",
  "Duelo",
  "TDAH",
  "Trauma",
  "Autoestima",
  "Estrés",
  "Adicciones",
  "Trastornos alimentarios",
];

const suggestedPopulations = [
  "Adultos",
  "Adolescentes",
  "Niños",
  "Parejas",
  "Familias",
  "Ejecutivos",
  "LGBTQ+",
  "Tercera edad",
];

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
      const { data: profileResponse, error: profileError } = await supabase
        .from("psychologist_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profileResponse) {
        setPsychologistId(profileResponse.id);

        // Load pricing data
        const { data: pricingResponse, error: pricingError } = await supabase
          .from("psychologist_pricing")
          .select("session_price")
          .eq("psychologist_id", profileResponse.id)
          .single();

        setProfileData({
          ...profileResponse,
          session_price: pricingResponse?.session_price || 0,
        } as ProfileData);
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
    if (!user || !profileData || !psychologistId) return;

    // Validate session price against experience-based limit
    const maxPrice = getMaxPrice(profileData.years_experience || 0);
    if (profileData.session_price && profileData.session_price > maxPrice) {
      toast.error(`El precio máximo para tu experiencia (${profileData.years_experience} años) es $${maxPrice} MXN`);
      return;
    }

    try {
      // Update profile (excluding email, phone, and years_experience)
      const { error: profileError } = await supabase
        .from("psychologist_profiles")
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          city: profileData.city,
          country: profileData.country,
          bio_short: profileData.bio_short,
          bio_extended: profileData.bio_extended,
          specialties: profileData.specialties,
          therapeutic_approaches: profileData.therapeutic_approaches,
          languages: profileData.languages,
          populations: profileData.populations,
          modalities: profileData.modalities,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update pricing with fixed universal values
      const { error: pricingError } = await supabase
        .from("psychologist_pricing")
        .update({
          session_duration_minutes: 50,
          minimum_notice_hours: 6,
          reschedule_window_hours: 12,
          session_price: profileData.session_price,
        })
        .eq("psychologist_id", psychologistId);

      if (pricingError) throw pricingError;

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
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileData?.email || ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">El correo no se puede modificar</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={profileData?.phone || ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">El teléfono no se puede modificar</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ciudad</Label>
                  <Input
                    value={profileData?.city || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData!, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>País</Label>
                  <Input
                    value={profileData?.country || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData!, country: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <Label>Idiomas de atención</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <div key={lang} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang}`}
                        checked={profileData?.languages.includes(lang)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfileData({
                              ...profileData!,
                              languages: [...(profileData?.languages || []), lang],
                            });
                          } else {
                            setProfileData({
                              ...profileData!,
                              languages: (profileData?.languages || []).filter((l) => l !== lang),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`lang-${lang}`} className="cursor-pointer font-normal">
                        {lang}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modalities */}
              <div className="space-y-3">
                <Label>Modalidad de atención</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {modalities.map((mod) => (
                    <div key={mod} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mod-${mod}`}
                        checked={profileData?.modalities.includes(mod)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfileData({
                              ...profileData!,
                              modalities: [...(profileData?.modalities || []), mod],
                            });
                          } else {
                            setProfileData({
                              ...profileData!,
                              modalities: (profileData?.modalities || []).filter((m) => m !== mod),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`mod-${mod}`} className="cursor-pointer font-normal">
                        {mod}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Years of Experience */}
              <div>
                <Label>Años de experiencia</Label>
                <Input
                  type="number"
                  value={profileData?.years_experience || 0}
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La experiencia se actualiza automáticamente cada año
                </p>
              </div>

              {/* Therapeutic Approaches */}
              <div className="space-y-3">
                <Label>Enfoques terapéuticos</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedApproaches.map((approach) => (
                    <Badge
                      key={approach}
                      variant={profileData?.therapeutic_approaches.includes(approach) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (profileData?.therapeutic_approaches.includes(approach)) {
                          setProfileData({
                            ...profileData!,
                            therapeutic_approaches: (profileData?.therapeutic_approaches || []).filter(
                              (a) => a !== approach
                            ),
                          });
                        } else {
                          setProfileData({
                            ...profileData!,
                            therapeutic_approaches: [...(profileData?.therapeutic_approaches || []), approach],
                          });
                        }
                      }}
                    >
                      {approach}
                      {profileData?.therapeutic_approaches.includes(approach) && (
                        <XIcon className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-3">
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedSpecialties.map((specialty) => (
                    <Badge
                      key={specialty}
                      variant={profileData?.specialties.includes(specialty) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (profileData?.specialties.includes(specialty)) {
                          setProfileData({
                            ...profileData!,
                            specialties: (profileData?.specialties || []).filter((s) => s !== specialty),
                          });
                        } else {
                          setProfileData({
                            ...profileData!,
                            specialties: [...(profileData?.specialties || []), specialty],
                          });
                        }
                      }}
                    >
                      {specialty}
                      {profileData?.specialties.includes(specialty) && <XIcon className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Populations */}
              <div className="space-y-3">
                <Label>Poblaciones que atiendes</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedPopulations.map((pop) => (
                    <Badge
                      key={pop}
                      variant={profileData?.populations.includes(pop) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (profileData?.populations.includes(pop)) {
                          setProfileData({
                            ...profileData!,
                            populations: (profileData?.populations || []).filter((p) => p !== pop),
                          });
                        } else {
                          setProfileData({
                            ...profileData!,
                            populations: [...(profileData?.populations || []), pop],
                          });
                        }
                      }}
                    >
                      {pop}
                      {profileData?.populations.includes(pop) && <XIcon className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bio Short */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Biografía corta</Label>
                  <span className="text-sm text-muted-foreground">
                    {profileData?.bio_short?.length || 0}/400
                  </span>
                </div>
                <Textarea
                  value={profileData?.bio_short || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData!, bio_short: e.target.value })
                  }
                  placeholder="Una breve descripción profesional..."
                  maxLength={400}
                  rows={3}
                />
              </div>

              {/* Bio Extended */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Biografía extendida</Label>
                  <span className="text-sm text-muted-foreground">
                    {profileData?.bio_extended?.length || 0}/1200
                  </span>
                </div>
                <Textarea
                  value={profileData?.bio_extended || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData!, bio_extended: e.target.value })
                  }
                  placeholder="Describe tu filosofía de trabajo..."
                  maxLength={1200}
                  rows={6}
                />
              </div>

              {/* Políticas universales info */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Políticas de reserva y sesiones:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Duración de sesión: 50 minutos</li>
                  <li>• Reserva con mínimo 6 horas de anticipación</li>
                  <li>• Cancelaciones: 12 horas antes de la cita</li>
                </ul>
              </div>

              {/* Session Price */}
              <div className="space-y-2">
                <Label>Precio por sesión (MXN)</Label>
                {profileData && (
                  <div className="rounded-lg bg-muted p-3 mb-2">
                    <p className="text-sm font-medium">
                      Límite de precio según tu experiencia ({profileData.years_experience || 0} años):
                    </p>
                    <p className="text-xl font-bold text-primary">
                      Hasta ${getMaxPrice(profileData.years_experience || 0)} MXN por sesión
                    </p>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    max={profileData ? getMaxPrice(profileData.years_experience || 0) : undefined}
                    value={profileData?.session_price || 0}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData!,
                        session_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-muted-foreground w-16">MXN</span>
                </div>
                {profileData && profileData.session_price > getMaxPrice(profileData.years_experience || 0) && (
                  <p className="text-sm text-destructive">
                    El precio excede el máximo permitido para tu experiencia
                  </p>
                )}
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
