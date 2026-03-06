import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { ClientTopbar } from "./ClientTopbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const ClientLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    // Don't redirect if already on the onboarding route
    if (location.pathname === "/portal/onboarding") return;

    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data?.onboarding_completed) {
          navigate("/portal/onboarding");
        }
      });
  }, [user, location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <ClientSidebar />

      <div className="flex-1 flex flex-col w-full">
        <ClientTopbar />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
    </div>
  );
};
