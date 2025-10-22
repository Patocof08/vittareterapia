import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { AuthPopup } from "./AuthPopup";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const location = useLocation();
  const { user, role } = useAuth();

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Terapeutas", path: "/therapists" },
    { name: "Precios", path: "/pricing" },
    { name: "Blog", path: "/blog" },
    { name: "Ayuda", path: "/faq" },
    { name: "Para psicólogos", path: "/para-psicologos" },
    { name: "Contacto", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">V</span>
              </div>
              <span className="font-bold text-xl text-foreground">Vittare</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Button
                  variant="default"
                  size="default"
                  asChild
                >
                  <Link to={
                    role === "admin" 
                      ? "/admin/dashboard" 
                      : role === "psicologo" 
                      ? "/therapist/dashboard" 
                      : "/portal"
                  }>
                    <User className="w-4 h-4 mr-2" />
                    {role === "admin" ? "Panel Admin" : role === "psicologo" ? "Mi Panel" : "Mi Portal"}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthPopup(true);
                    }}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => {
                      setAuthMode("signup");
                      setShowAuthPopup(true);
                    }}
                  >
                    Regístrate
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                {user ? (
                  <Button
                    variant="default"
                    className="mt-4"
                    asChild
                  >
                    <Link to={
                      role === "admin" 
                        ? "/admin/dashboard" 
                        : role === "psicologo" 
                        ? "/therapist/dashboard" 
                        : "/portal"
                    }>
                      <User className="w-4 h-4 mr-2" />
                      {role === "admin" ? "Panel Admin" : role === "psicologo" ? "Mi Panel" : "Mi Portal"}
                    </Link>
                  </Button>
                ) : (
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setAuthMode("login");
                        setShowAuthPopup(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Iniciar sesión
                    </Button>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => {
                        setAuthMode("signup");
                        setShowAuthPopup(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Regístrate
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthPopup 
        isOpen={showAuthPopup} 
        onClose={() => setShowAuthPopup(false)}
        initialMode={authMode}
      />
    </>
  );
};
