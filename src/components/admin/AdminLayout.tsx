import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VittareLoader } from "@/components/VittareLogo";

export const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstRender = useRef(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsTransitioning(true);
    const t = setTimeout(() => setIsTransitioning(false), 500);
    return () => clearTimeout(t);
  }, [location.key]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col w-full min-w-0">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {isTransitioning && (
            <div className="flex items-center justify-center h-64">
              <VittareLoader size={72} />
            </div>
          )}
          <div className={isTransitioning ? "hidden" : ""}>
            <Outlet key={location.key} />
          </div>
        </main>
      </div>
    </div>
  );
};
