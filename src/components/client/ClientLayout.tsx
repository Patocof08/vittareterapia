import { Outlet } from "react-router-dom";
import { ClientSidebar } from "./ClientSidebar";
import { ClientTopbar } from "./ClientTopbar";

export const ClientLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <ClientSidebar />
      
      <div className="flex-1 flex flex-col w-full">
        <ClientTopbar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
