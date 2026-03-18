import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthPopup } from "./AuthPopup";
import { useAuth } from "@/hooks/useAuth";
import { VittareIsotipo } from "./VittareLogo";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const { user, role } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      const doc = document.documentElement;
      const h = doc.scrollHeight - doc.clientHeight;
      setScrollProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Terapeutas", path: "/therapists" },
    { name: "Nosotros", path: "/sobre-nosotros" },
    { name: "Precios", path: "/pricing" },
    { name: "Blog", path: "/blog" },
    { name: "Ayuda", path: "/faq" },
    { name: "Para psicólogos", path: "/para-psicologos" },
    { name: "Contacto", path: "/contact" },
  ];

  const isActive = (path: string) =>
    path.startsWith("/#")
      ? false
      : location.pathname === path;

  return (
    <>
      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#12A357] to-[#7FCFC2] transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(31,77,46,0.08)]"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <VittareIsotipo spin />
              <div>
                <div className="font-display text-[#1F4D2E] text-xl leading-none tracking-tight">
                  vittare
                </div>
                <div className="font-karla text-[8px] text-[#6D8F7A] uppercase tracking-[0.18em] leading-none mt-0.5">
                  Reconecta Contigo
                </div>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 font-karla text-sm transition-colors duration-200 rounded-lg group ${
                    isActive(link.path)
                      ? "text-[#12A357] font-semibold"
                      : "text-[#3A6A4C] hover:text-[#1F4D2E]"
                  }`}
                >
                  {link.name}
                  {/* Animated underline */}
                  <span className="absolute bottom-1 left-4 right-4 h-px bg-[#12A357] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </Link>
              ))}
            </div>

            {/* Desktop auth */}
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
                    {role === "psicologo" ? "Mi Panel" : "Mi Portal"}
                  </Link>
                </Button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthPopup(true);
                    }}
                    className="font-karla text-sm text-[#3A6A4C] hover:text-[#1F4D2E] px-3 py-2 rounded-lg hover:bg-[#12A357]/5 transition-all duration-200 cursor-pointer"
                  >
                    Iniciar sesión
                  </button>
                  <motion.button
                    onClick={() => {
                      setAuthMode("signup");
                      setShowAuthPopup(true);
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(18,163,87,0.30)" }}
                    whileTap={{ scale: 0.98 }}
                    className="relative px-5 py-2.5 bg-[#12A357] text-white font-karla font-bold text-sm rounded-xl overflow-hidden cursor-pointer transition-colors duration-200 hover:bg-[#0F8A4A]"
                  >
                    Empezar ahora
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-[#12A357]/8 text-[#1F4D2E] transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden overflow-hidden border-t border-[#1F4D2E]/8"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      className="block px-4 py-3 font-karla text-[#3A6A4C] hover:text-[#1F4D2E] hover:bg-[#12A357]/5 rounded-xl transition-colors cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                {!user && (
                  <div className="mt-3 pt-3 border-t border-[#1F4D2E]/8 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setShowAuthPopup(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-3 font-karla text-[#3A6A4C] rounded-xl border border-[#12A357]/30 hover:bg-[#12A357]/5 transition-colors cursor-pointer"
                    >
                      Iniciar sesión
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("signup");
                        setShowAuthPopup(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-3 bg-[#12A357] text-white font-karla font-bold rounded-xl transition-colors hover:bg-[#0F8A4A] cursor-pointer"
                    >
                      Empezar ahora
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        initialMode={authMode}
      />
    </>
  );
};
