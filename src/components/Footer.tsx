import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Footer = () => {
  const { user, role } = useAuth();

  const handleJoinClick = () => {
    if (user && role === "cliente") {
      alert("Actualmente estás en sesión como paciente. Para registrarte como psicólogo, primero cierra tu sesión actual.");
      return;
    }
    
    if (user && role === "psicologo") {
      window.location.href = "/therapist/dashboard";
      return;
    }
    
    window.location.href = "/onboarding-psicologo";
  };

  return (
    <footer className="bg-muted border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marca */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">V</span>
              </div>
              <span className="font-bold text-xl text-foreground">Vittare</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Terapia en línea segura y profesional. Tu bienestar mental es nuestra prioridad.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/therapists" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Nuestros terapeutas
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Precios
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/para-psicologos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Para psicólogos
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Política de cookies
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>contacto@vittare.com</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                <span>+52 55 1234 5678</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <span>Ciudad de México, México</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <p className="text-sm text-muted-foreground">¿Eres psicólogo?</p>
            <Button onClick={handleJoinClick} variant="outline" size="sm">
              Únete al equipo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Vittare. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            En caso de emergencia, contacta a los servicios de emergencia de tu localidad o llama a la línea de la vida: 800 911 2000
          </p>
        </div>
      </div>
    </footer>
  );
};
