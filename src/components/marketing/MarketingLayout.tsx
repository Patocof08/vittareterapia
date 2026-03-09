import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MarketingSidebar } from "./MarketingSidebar";
import { MarketingTopbar } from "./MarketingTopbar";

export const MarketingLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <MarketingSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col w-full">
        <MarketingTopbar onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
            <Outlet key={location.pathname} />
          </div>
        </main>
      </div>
    </div>
  );
};
