import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { AuthPopup } from "./AuthPopup";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const { user, role } = useAuth();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      const doc = document.documentElement;
      const scrollTop = scrollY;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Terapeutas", path: "/therapists" },
    { name: "Precios", path: "/pricing" },
    { name: "Blog", path: "/blog" },
    { name: "Para psicólogos", path: "/para-psicologos" },
    { name: "Ayuda", path: "/faq" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const navBg = isLanding
    ? scrolled
      ? "bg-[#0A1A10]/90 backdrop-blur-xl border-b border-white/[0.06]"
      : "bg-transparent border-b border-transparent"
    : "bg-background/95 backdrop-blur-sm border-b border-border shadow-soft";

  const linkBase = isLanding
    ? "text-zinc-400 hover:text-zinc-100"
    : "text-muted-foreground hover:text-foreground";

  const linkActive = isLanding
    ? "text-zinc-100 bg-white/[0.06]"
    : "bg-accent text-accent-foreground";

  const logoTextColor = isLanding ? "text-zinc-100" : "text-foreground";

  return (
    <>
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#12A357] via-[#7FCFC2] to-[#12A357] transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${navBg}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-[#12A357] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(18,163,87,0.35)] group-hover:shadow-[0_0_20px_rgba(18,163,87,0.5)] transition-shadow duration-300">
                <span className="text-white font-bold text-lg font-karla">
                  V
                </span>
              </div>
              <span className={`font-karla font-bold text-xl ${logoTextColor}`}>
                Vittare
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium font-karla transition-all duration-200 ${
                    isActive(link.path) ? linkActive : linkBase
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <Button variant="default" size="default" asChild>
                  <Link
                    to={
                      role === "admin"
                        ? "/admin/dashboard"
                        : role === "marketing"
                        ? "/marketing/dashboard"
                        : role === "psicologo"
                        ? "/therapist/dashboard"
                        : "/portal"
                    }
                  >
                    <User className="w-4 h-4 mr-2" />
                    {role === "admin"
                      ? "Panel Admin"
                      : role === "marketing"
                      ? "Marketing"
                      : role === "psicologo"
                      ? "Mi Panel"
                      : "Mi Portal"}
                  </Link>
                </Button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthPopup(true);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-karla font-medium transition-all duration-200 cursor-pointer ${
                      isLanding
                        ? "text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.06]"
                        : "text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20"
                    }`}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setShowAuthPopup(true);
                    }}
                    className="relative px-5 py-2 bg-[#12A357] text-white text-sm font-karla font-bold rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:bg-[#0F8A4A] shadow-[0_0_18px_rgba(18,163,87,0.25)] hover:shadow-[0_0_28px_rgba(18,163,87,0.4)] active:scale-[0.97] group"
                  >
                    <span className="relative z-10">Comenzar</span>
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-600" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
                isLanding ? "text-zinc-300 hover:bg-white/[0.06]" : "hover:bg-accent"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isMenuOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div
              className={`py-4 border-t ${
                isLanding ? "border-white/[0.06]" : "border-border"
              }`}
            >
              <div className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-karla font-medium transition-colors cursor-pointer ${
                      isActive(link.path) ? linkActive : linkBase
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                {user ? (
                  <Button variant="default" className="mt-4" asChild>
                    <Link
                      to={
                        role === "admin"
                          ? "/admin/dashboard"
                          : role === "psicologo"
                          ? "/therapist/dashboard"
                          : "/portal"
                      }
                    >
                      <User className="w-4 h-4 mr-2" />
                      {role === "psicologo" ? "Mi Panel" : "Mi Portal"}
                    </Link>
                  </Button>
                ) : (
                  <div className="mt-4 space-y-2 pt-2 border-t border-white/[0.06]">
                    <button
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-karla font-medium transition-colors cursor-pointer ${linkBase}`}
                      onClick={() => {
                        setAuthMode("login");
                        setShowAuthPopup(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Iniciar sesión
                    </button>
                    <button
                      className="w-full px-4 py-3 bg-[#12A357] text-white rounded-lg text-sm font-karla font-bold transition-colors hover:bg-[#0F8A4A] cursor-pointer"
                      onClick={() => {
                        setAuthMode("signup");
                        setShowAuthPopup(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      Comenzar gratis
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
