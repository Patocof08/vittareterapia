import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"psicologo" | "cliente" | "">("");
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/therapists');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!isLogin) {
      if (!name) {
        toast.error("Por favor ingresa tu nombre");
        return;
      }
      
      if (!role) {
        toast.error("Por favor selecciona tu rol");
        return;
      }
    }

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("¡Bienvenido! Has iniciado sesión correctamente");
        navigate('/therapists');
      } else {
        await signUp(email, password, name, role as "psicologo" | "cliente");
        toast.success("¡Cuenta creada! Tu cuenta ha sido creada exitosamente");
        // The signUp function will handle navigation based on role
      }
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error. Por favor intenta de nuevo.");
    }
  };

  const handleForgotPassword = () => {
    toast.info("Se ha enviado un correo para restablecer tu contraseña");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Accede a tu cuenta para continuar" 
                : "Regístrate para guardar tus preferencias"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
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

                <div className="space-y-3">
                  <Label>Tipo de cuenta</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "psicologo" | "cliente")}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="cliente" id="cliente" />
                      <Label htmlFor="cliente" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Soy cliente</div>
                        <div className="text-xs text-muted-foreground">Busco terapia</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="psicologo" id="psicologo" />
                      <Label htmlFor="psicologo" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Soy psicólogo</div>
                        <div className="text-xs text-muted-foreground">Ofrezco servicios</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
          <div className="mt-6">
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
            {!isLogin && (
              <p className="text-xs text-center text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                Tus respuestas se usan sólo para mejorar tus recomendaciones. No contienen datos clínicos sensibles.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
