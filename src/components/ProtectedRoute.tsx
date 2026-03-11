import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "psicologo" | "cliente" | "admin" | "marketing";
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== null) {
      if (!user) {
        navigate("/", { replace: true });
      } else if (role !== allowedRole) {
        navigate("/", { replace: true });
      }
    }
  }, [user, role, loading, allowedRole, navigate]);

  // Mostrar spinner mientras carga el auth O mientras el usuario existe pero el rol aún no llegó
  if (loading || (user && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};
