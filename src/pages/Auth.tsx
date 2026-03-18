import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, ArrowRight } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"psicologo" | "cliente" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, user, role: authRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && authRole && !isSubmitting) {
      if (authRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (authRole === "marketing") {
        navigate("/marketing/dashboard", { replace: true });
      } else if (authRole === "psicologo") {
        navigate("/therapist/dashboard", { replace: true });
      } else if (authRole === "cliente") {
        navigate("/portal", { replace: true });
      }
    }
  }, [user, authRole, loading, navigate, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    if (!isLogin) {
      if (!name) { toast.error("Por favor ingresa tu nombre"); return; }
      if (!role) { toast.error("Por favor selecciona tu tipo de cuenta"); return; }
    }
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("¡Bienvenido!");
      } else {
        await signUp(email, password, name, role as "psicologo" | "cliente");
        toast.success("¡Cuenta creada!");
        if (role === "psicologo") {
          navigate("/onboarding-psicologo");
        } else if (role === "cliente") {
          navigate("/portal/onboarding");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error. Por favor intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Se ha enviado un correo para restablecer tu contraseña");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12 px-4"
      style={{ background: "linear-gradient(160deg, #F0FAF8 0%, #FAFAF8 50%, #E8F7F0 100%)" }}
    >
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] opacity-30"
          style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-8"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
            <path d="M20 4C20 4 27 10 27 18C27 22 24 26 20 26C16 26 13 22 13 18C13 10 20 4 20 4Z" fill="#12A357" opacity="0.55" />
            <path d="M36 20C36 20 30 27 22 27C18 27 14 24 14 20C14 16 18 13 22 13C30 13 36 20 36 20Z" fill="#12A357" opacity="0.55" />
            <path d="M20 36C20 36 13 30 13 22C13 18 16 14 20 14C24 14 27 18 27 22C27 30 20 36 20 36Z" fill="#12A357" opacity="0.55" />
            <path d="M4 20C4 20 10 13 18 13C22 13 26 16 26 20C26 24 22 27 18 27C10 27 4 20 4 20Z" fill="#12A357" opacity="0.55" />
            <path d="M20 27C17 24 14 21 14 18.5C14 16.5 16 15 17.5 16L20 19L22.5 16C24 15 26 16.5 26 18.5C26 21 23 24 20 27Z" fill="#1F4D2E" />
          </svg>
          <div>
            <div className="font-display text-[#1F4D2E] text-xl leading-none">vittare</div>
            <div className="font-karla text-[8px] text-[#6AB7AB] uppercase tracking-[0.18em] leading-none mt-0.5">Reconecta Contigo</div>
          </div>
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="bg-white rounded-3xl p-8 border"
          style={{ borderColor: "#BFE9E2", boxShadow: "0 8px 40px rgba(18,163,87,0.08)" }}
        >
          {/* Top wash */}
          <div
            className="absolute top-0 left-0 right-0 h-20 rounded-t-3xl opacity-40"
            style={{ background: "linear-gradient(180deg, #D4F0E2 0%, transparent 100%)" }}
          />

          <div className="relative z-10">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-karla uppercase tracking-wider"
                style={{ background: "#D4F0E2", color: "#12A357" }}
              >
                <Sparkles className="w-3 h-3" />
                {isLogin ? "Accede a tu cuenta" : "Crea tu cuenta"}
              </div>
            </div>

            <h1 className="font-erstoria text-3xl text-[#1F4D2E] leading-tight tracking-[-0.02em] mb-1">
              {isLogin ? "Bienvenido de vuelta" : "Empieza tu proceso"}
            </h1>
            <p className="font-karla text-[#6D8F7A] text-sm mb-7">
              {isLogin
                ? "Inicia sesión para continuar"
                : "Regístrate para guardar tus preferencias"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="font-karla text-sm text-[#3A6A4C] font-medium">Nombre completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-[#BFE9E2] focus:border-[#12A357] font-karla"
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-karla text-sm text-[#3A6A4C] font-medium">Tipo de cuenta</Label>
                    <RadioGroup value={role} onValueChange={(value) => setRole(value as "psicologo" | "cliente")} className="space-y-2">
                      {[
                        { value: "cliente", title: "Soy paciente", sub: "Busco terapia para mí" },
                        { value: "psicologo", title: "Soy psicólogo", sub: "Ofrezco servicios terapéuticos" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          htmlFor={opt.value}
                          className="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all"
                          style={{
                            borderColor: role === opt.value ? "#12A357" : "#BFE9E2",
                            background: role === opt.value ? "#D4F0E2" : "white",
                          }}
                        >
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <div>
                            <div className="font-karla font-semibold text-sm text-[#1F4D2E]">{opt.title}</div>
                            <div className="font-karla text-xs text-[#6D8F7A]">{opt.sub}</div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-karla text-sm text-[#3A6A4C] font-medium">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#BFE9E2] focus:border-[#12A357] font-karla"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="font-karla text-sm text-[#3A6A4C] font-medium">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-[#BFE9E2] focus:border-[#12A357] font-karla"
                  required
                />
              </div>

              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-karla text-sm text-[#6AB7AB] hover:text-[#12A357] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 24px rgba(18,163,87,0.25)" }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#12A357] text-white font-karla font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Iniciar sesión" : "Crear cuenta"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="font-karla text-center text-sm text-[#6D8F7A]">
                {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#12A357] font-semibold hover:underline"
                >
                  {isLogin ? "Crear cuenta" : "Iniciar sesión"}
                </button>
              </p>
            </form>

            <p className="font-karla text-xs text-center text-[#6D8F7A] mt-5 leading-relaxed">
              Al continuar, aceptas nuestros{" "}
              <Link to="/terms" className="text-[#12A357] hover:underline">Términos</Link>{" "}
              y{" "}
              <Link to="/privacy" className="text-[#12A357] hover:underline">Aviso de Privacidad</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
