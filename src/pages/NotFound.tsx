import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Home } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      <div className="flex-1 flex items-center justify-center relative overflow-hidden py-20">
        {/* Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-30"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20"
            style={{ background: "radial-gradient(circle, #D4F0E2 0%, transparent 65%)" }} />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* 404 number */}
            <div
              className="font-erstoria text-[clamp(6rem,20vw,14rem)] leading-none select-none mb-4"
              style={{ color: "#BFE9E2" }}
            >
              404
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-karla uppercase tracking-wider mb-6"
              style={{ background: "#D4F0E2", borderColor: "#BFE9E2", color: "#12A357", border: "1px solid #BFE9E2" }}
            >
              Página no encontrada
            </div>

            <h1 className="font-erstoria text-[clamp(1.8rem,4vw,2.8rem)] text-[#1F4D2E] leading-[1.15] tracking-[-0.02em] mb-4 max-w-lg mx-auto">
              Parece que te perdiste en el camino
            </h1>

            <p className="font-karla text-[#6D8F7A] text-lg mb-10 max-w-md mx-auto leading-relaxed">
              La página que buscas no existe o fue movida. Regresa al inicio y continúa tu proceso.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(18,163,87,0.25)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 bg-[#12A357] text-white font-karla font-bold rounded-2xl cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Ir al inicio
                </motion.button>
              </Link>
              <Link to="/therapists">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 font-karla font-bold rounded-2xl border-2 cursor-pointer"
                  style={{ borderColor: "#BFE9E2", color: "#1F4D2E" }}
                >
                  Ver psicólogos
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default NotFound;
