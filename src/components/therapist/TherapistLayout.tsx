import { Outlet, useNavigate } from "react-router-dom";
import { TherapistSidebar } from "./TherapistSidebar";
import { TherapistTopbar } from "./TherapistTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const TherapistLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{
    onboardingStep: number;
    verificationStatus: string;
    isPublished: boolean;
  } | null>(null);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) return;

      try {
        // @ts-ignore - Types will regenerate automatically
        const { data, error } = await supabase
          .from("psychologist_profiles")
          .select("onboarding_step, verification_status, is_published")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfileStatus({
            onboardingStep: data.onboarding_step || 1,
            verificationStatus: data.verification_status || "pending",
            isPublished: data.is_published || false,
          });

          // Si no ha completado el onboarding (paso < 5), redirigir
          if (data.onboarding_step < 5) {
            navigate("/onboarding-psicologo", { replace: true });
            return;
          }

          // Si completó onboarding pero no está aprobado, mostrar página de verificación
          if (data.onboarding_step >= 5 && data.verification_status !== "approved") {
            navigate("/therapist/pending-verification", { replace: true });
            return;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
