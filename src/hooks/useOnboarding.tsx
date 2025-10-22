import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { logger, handleDatabaseError } from "@/lib/logger";

export interface OnboardingData {
  // Step 1
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  languages?: string[];
  modalities?: string[];
  profile_photo_url?: string;
  
  // Step 2
  years_experience?: number;
  therapeutic_approaches?: string[];
  specialties?: string[];
  populations?: string[];
  bio_short?: string;
  bio_extended?: string;
  
  // Step 3
  terms_accepted?: boolean;
  emergency_disclaimer_accepted?: boolean;
  
  // Step 4
  availability?: any[];
  session_duration_minutes?: number;
  minimum_notice_hours?: number;
  reschedule_window_hours?: number;
  
  // Step 5
  session_price?: number;
  currency?: string;
  package_4_price?: number;
  package_8_price?: number;
  first_session_price?: number;
  cancellation_policy?: string;
  refund_policy?: string;
  late_tolerance_minutes?: number;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    languages: [],
    modalities: [],
    therapeutic_approaches: [],
    specialties: [],
    populations: [],
    currency: "MXN",
    session_duration_minutes: 50,
    minimum_notice_hours: 24,
    reschedule_window_hours: 24,
    late_tolerance_minutes: 10,
  });

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!user || !profileId) return;

    const interval = setInterval(() => {
      saveProgress();
    }, 10000);

    return () => clearInterval(interval);
  }, [data, user, profileId]);

  // Load existing profile on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Ensure the user has 'psicologo' role before any profile operations (RLS requirement)
      // @ts-ignore - Types will regenerate automatically
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id);
      
      // If error is not a "not found" error, throw it
      if (rolesError && rolesError.code !== "PGRST116") {
        throw rolesError;
      }
      
      const hasPsyRole = Array.isArray(roles) && roles.some((r: any) => r.role === "psicologo");
      if (!hasPsyRole) {
        // Try to insert role, ignore if it already exists
        // @ts-ignore - Types will regenerate automatically
        const { error: roleInsertError } = await supabase
          .from("user_roles")
          .insert({ user_id: user?.id, role: "psicologo" });
        
        // Ignore duplicate key errors (23505), throw all others
        if (roleInsertError && roleInsertError.code !== "23505") {
          throw roleInsertError;
        }
      }

      // Try to fetch existing profile
      let profileData: any = null;
      {
        // @ts-ignore - Types will regenerate automatically
        const { data: profile, error } = await supabase
          .from("psychologist_profiles")
          .select("*")
          .eq("user_id", user?.id)
          .maybeSingle();
        if (error) {
          logger.warn("Profile select failed, will attempt upsert", error);
        } else {
          profileData = profile;
        }
      }

      // Upsert to avoid duplicate key errors and ensure profile exists
      if (!profileData) {
        // @ts-ignore - Types will regenerate automatically
        const { data: upserted, error: upsertError } = await supabase
          .from("psychologist_profiles")
          .upsert(
            { user_id: user?.id, email: user?.email },
            { onConflict: "user_id" }
          )
          .select()
          .single();
        if (upsertError) throw upsertError;
        profileData = upserted;
      }

      setProfileId(profileData.id);
      setCurrentStep(profileData.onboarding_step || 1);
      setData({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        city: profileData.city,
        country: profileData.country,
        languages: profileData.languages || [],
        modalities: profileData.modalities || [],
        profile_photo_url: profileData.profile_photo_url,
        years_experience: profileData.years_experience,
        therapeutic_approaches: profileData.therapeutic_approaches || [],
        specialties: profileData.specialties || [],
        populations: profileData.populations || [],
        bio_short: profileData.bio_short,
        bio_extended: profileData.bio_extended,
        terms_accepted: profileData.terms_accepted,
        emergency_disclaimer_accepted: profileData.emergency_disclaimer_accepted,
      });
    } catch (error: any) {
      const message = handleDatabaseError(error, "loading profile");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (silent = true, stepOverride?: number) => {
    if (!user || !profileId) return;

    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase
        .from("psychologist_profiles")
        .update({
          ...data,
          onboarding_step: stepOverride ?? currentStep,
        })
        .eq("id", profileId);

      if (error) throw error;

      if (!silent) {
        toast.success("Progreso guardado");
      }
    } catch (error: any) {
      if (!silent) {
        const message = handleDatabaseError(error, "saving progress");
        toast.error(message);
      }
    }
  };

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const goToStep = async (step: number) => {
    await saveProgress(false, step);
    setCurrentStep(step);
  };

  const nextStep = async () => {
    const newStep = Math.min(currentStep + 1, 5);
    await saveProgress(false, newStep);
    setCurrentStep(newStep);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const uploadFile = async (file: File, type: "document" | "photo") => {
    if (!user || !profileId) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("psychologist-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Use signed URLs for security (24 hour expiration)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("psychologist-files")
        .createSignedUrl(fileName, 86400);

      if (signedError) throw signedError;

      return signedData.signedUrl;
    } catch (error: any) {
      const message = handleDatabaseError(error, "uploading file");
      toast.error(message);
      return null;
    }
  };

  const uploadDocument = async (file: File, documentType: string) => {
    if (!profileId || !user) {
      throw new Error("No hay perfil o usuario disponible");
    }

    try {
      // Generate unique filename with permanent path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/document-${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('psychologist-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Insert document record with permanent path (not signed URL)
      // @ts-ignore - Types will regenerate automatically
      const { error: insertError } = await supabase
        .from('psychologist_documents')
        .insert({
          psychologist_id: profileId,
          document_type: documentType as any,
          file_path: fileName, // Store permanent path
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        });

      if (insertError) throw insertError;

      toast.success("Documento subido correctamente");
    } catch (error: any) {
      handleDatabaseError(error, "Error al subir documento");
      throw error;
    }
  };

  const saveAvailability = async (availability: any[]) => {
    if (!profileId) return;

    try {
      // Delete existing availability
      // @ts-ignore - Types will regenerate automatically
      await supabase
        .from("psychologist_availability")
        .delete()
        .eq("psychologist_id", profileId);

      // Insert new availability
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase
        .from("psychologist_availability")
        .insert(
          availability.map((slot) => ({
            psychologist_id: profileId,
            ...slot,
          }))
        );

      if (error) throw error;
      toast.success("Disponibilidad guardada");
    } catch (error: any) {
      const message = handleDatabaseError(error, "saving availability");
      toast.error(message);
    }
  };

  const savePricing = async (pricingData: any) => {
    if (!profileId) return;

    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase
        .from("psychologist_pricing")
        .upsert({
          psychologist_id: profileId,
          ...pricingData,
        });

      if (error) throw error;
      toast.success("Precios guardados");
    } catch (error: any) {
      const message = handleDatabaseError(error, "saving pricing");
      toast.error(message);
    }
  };

  const publishProfile = async () => {
    if (!profileId) return false;

    try {
      // @ts-ignore - Types will regenerate automatically
      const { error } = await supabase
        .from("psychologist_profiles")
        .update({ 
          is_published: false, // No publicar hasta aprobación
          onboarding_step: 5 // Marcar como completado
        })
        .eq("id", profileId);

      if (error) throw error;
      toast.success("¡Registro completado! Tu perfil está en revisión.");
      return true;
    } catch (error: any) {
      const message = handleDatabaseError(error, "completing registration");
      toast.error(message);
      return false;
    }
  };

  return {
    loading,
    profileId,
    currentStep,
    data,
    updateData,
    goToStep,
    nextStep,
    prevStep,
    saveProgress,
    uploadFile,
    uploadDocument,
    saveAvailability,
    savePricing,
    publishProfile,
  };
};

// Shared context provider to ensure a single onboarding state across the page
export type OnboardingContextType = ReturnType<typeof useOnboarding>;
export const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const value = useOnboarding();
  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
};

export const useOnboardingContext = (): OnboardingContextType => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingContext must be used within OnboardingProvider");
  }
  return ctx;
};
