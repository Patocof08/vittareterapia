import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { validatePassword } from "@/lib/validation";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export const AuthPopup = ({ isOpen, onClose, initialMode = "login" }: AuthPopupProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signIn, signUp } = useAuth();

  // Reset to initial mode when popup opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === "login");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim() || !email.includes("@")) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    if (!password) {
      toast.error("Por favor ingresa tu contraseña");
      return;
    }

    // For signup, validate name and password strength
    if (!isLogin) {
      if (!name.trim()) {
        toast.error("Por favor ingresa tu nombre");
        return;
      }

      if (name.trim().length < 2 || name.trim().length > 200) {
        toast.error("El nombre debe tener entre 2 y 200 caracteres");
        return;
      }

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
        toast.error("El nombre solo puede contener letras");
        return;
      }

      // Validate password strength
      const passwordError = validatePassword(password);
      if (passwordError) {
        toast.error(passwordError);
        return;
      }
    }

    try {
      if (isLogin) {
        await signIn(email.trim().toLowerCase(), password);
        toast.success("¡Bienvenido! Has iniciado sesión correctamente");
      } else {
        // Always create as "cliente" from this popup
        await signUp(email.trim().toLowerCase(), password, name.trim(), "cliente");
        toast.success("¡Cuenta creada! Bienvenido a Vittare");
      }
      
      onClose();
      setEmail("");
      setPassword("");
      setName("");
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error. Por favor intenta de nuevo.");
    }
  };

  const handleForgotPassword = () => {
    toast.info("Se ha enviado un correo para restablecer tu contraseña");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-large w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? "Iniciar sesión" : "Crea tu cuenta"}
            </h2>
            {!isLogin && (
              <p className="text-sm text-muted-foreground mt-1">
                Para agendar tu primera sesión
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder={isLogin ? "••••••••" : "Mínimo 8 caracteres, con mayúscula, número y símbolo"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground">
                Debe contener: mayúscula, minúscula, número y carácter especial (@$!%*?&#)
              </p>
            )}
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <Button type="submit" className="w-full" size="lg">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-center text-muted-foreground">
            Al continuar, aceptas nuestros{" "}
            <a href="/terms" className="text-primary hover:underline">
              Términos y Condiciones
            </a>{" "}
            y{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Aviso de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
