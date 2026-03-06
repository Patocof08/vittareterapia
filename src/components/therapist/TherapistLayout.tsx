import { Outlet, useNavigate } from "react-router-dom";
import { TherapistSidebar } from "./TherapistSidebar";
import { TherapistTopbar } from "./TherapistTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const TherapistLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{
    onboardingStep: number;
    verificationStatus: string;
    isPublished: boolean;
  } | null>(null);

  const [needsPhoto, setNeedsPhoto] = useState(false);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) return;

      try {
        // @ts-ignore - Types will regenerate automatically
        const { data, error } = await supabase
          .from("psychologist_profiles")
          .select("id, onboarding_step, verification_status, is_published, profile_photo_url")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setPsychologistId(data.id);
          setProfileStatus({
            onboardingStep: data.onboarding_step || 1,
            verificationStatus: data.verification_status || "pending",
            isPublished: data.is_published || false,
          });

          if (data.onboarding_step < 5) {
            navigate("/onboarding-psicologo", { replace: true });
            return;
          }

          if (data.onboarding_step >= 5 && data.verification_status !== "approved") {
            navigate("/therapist/pending-verification", { replace: true });
            return;
          }

          if (!data.profile_photo_url || data.profile_photo_url.trim() === "") {
            setNeedsPhoto(true);
          }
        }
      } catch (error) {
        console.error("Error checking profile status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProfileStatus();
  }, [user, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !psychologistId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("psychologist-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("psychologist-files")
        .getPublicUrl(filePath);

      // @ts-ignore
      const { error: updateError } = await supabase
        .from("psychologist_profiles")
        .update({ profile_photo_url: urlData.publicUrl })
        .eq("id", psychologistId);

      if (updateError) throw updateError;

      setPreviewUrl(urlData.publicUrl);
      toast.success("¡Foto de perfil actualizada!");
      setTimeout(() => setNeedsPhoto(false), 1000);
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsPhoto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-large border border-border p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Foto de perfil requerida</h2>
          <p className="text-muted-foreground mb-6">
            Para que los pacientes te conozcan, necesitas subir una foto de perfil profesional antes de continuar.
          </p>
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="w-32 h-32 border-4 border-primary/20">
              {previewUrl ? (
                <AvatarImage src={previewUrl} />
              ) : (
                <AvatarFallback>
                  <User className="w-16 h-16 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            <input
              type="file"
              id="photo-upload-blocker"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            <Button
              size="lg"
              onClick={() => document.getElementById("photo-upload-blocker")?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Subiendo..." : "Seleccionar foto"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Recomendamos una foto profesional, de frente, con buena iluminación. Máximo 5MB.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <TherapistSidebar />

      <div className="flex-1 flex flex-col w-full">
        <TherapistTopbar />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
