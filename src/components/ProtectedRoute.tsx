import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "psicologo" | "cliente" | "admin";
}

export const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No hay usuario, redirigir a home
        navigate("/", { replace: true });
      } else if (role !== allowedRole) {
        // El usuario no tiene el rol correcto, redirigir a home
        navigate("/", { replace: true });
      }
    }
  }, [user, role, loading, allowedRole, navigate]);

  // Mostrar nada mientras carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no hay usuario o el rol no coincide, no mostrar nada (el useEffect redirigirá)
  if (!user || role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};
