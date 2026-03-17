import { Link } from "react-router-dom";
import { Mail, MapPin, Instagram, Twitter, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

const VittaraLogo = () => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-9 h-9"
    aria-hidden="true"
  >
    <path d="M20 4C20 4 27 10 27 18C27 22 24 26 20 26C16 26 13 22 13 18C13 10 20 4 20 4Z" fill="#12A357" opacity="0.55" />
    <path d="M36 20C36 20 30 27 22 27C18 27 14 24 14 20C14 16 18 13 22 13C30 13 36 20 36 20Z" fill="#12A357" opacity="0.55" />
    <path d="M20 36C20 36 13 30 13 22C13 18 16 14 20 14C24 14 27 18 27 22C27 30 20 36 20 36Z" fill="#12A357" opacity="0.55" />
    <path d="M4 20C4 20 10 13 18 13C22 13 26 16 26 20C26 24 22 27 18 27C10 27 4 20 4 20Z" fill="#12A357" opacity="0.55" />
    <path d="M20 27C17 24 14 21 14 18.5C14 16.5 16 15 17.5 16L20 19L22.5 16C24 15 26 16.5 26 18.5C26 21 23 24 20 27Z" fill="#1F4D2E" />
  </svg>
);

const footerLinks = [
  {
    title: "Plataforma",
    links: [
      { name: "Cómo funciona", href: "/#como-funciona" },
      { name: "Psicólogos", href: "/therapists" },
      { name: "Planes y precios", href: "/pricing" },
      { name: "Para psicólogos", href: "/para-psicologos" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { name: "Sobre nosotros", href: "/sobre-nosotros" },
      { name: "Blog", href: "/blog" },
      { name: "Preguntas frecuentes", href: "/faq" },
      { name: "Contacto", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Aviso de privacidad", href: "/privacy" },
      { name: "Términos y condiciones", href: "/terms" },
      { name: "Política de cookies", href: "/cookies" },
      { name: "Política de citas", href: "/politica-citas" },
    ],
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const LandingFooter = () => {
  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #F0FAF8 0%, #E8F7F3 50%, #F0FAF8 100%)",
        borderTop: "1px solid #BFE9E2",
      }}
    >
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14"
        >
          {/* Brand */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <VittaraLogo />
              <div>
                <div className="font-display text-[#1F4D2E] text-xl leading-none">
                  vittare
                </div>
                <div className="font-karla text-[8px] text-[#6AB7AB] uppercase tracking-[0.18em] leading-none mt-0.5">
                  Reconecta Contigo
                </div>
              </div>
            </Link>
            <p className="font-karla text-sm text-[#6D8F7A] leading-relaxed max-w-xs mb-6">
              Hacemos la terapia psicológica más accesible, humana y libre de
              estigmas en México.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                  style={{
                    background: "#BFE9E240",
                    color: "#6AB7AB",
                    border: "1px solid #BFE9E2",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#12A35720";
                    (e.currentTarget as HTMLElement).style.color = "#12A357";
                    (e.currentTarget as HTMLElement).style.borderColor = "#12A35740";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#BFE9E240";
                    (e.currentTarget as HTMLElement).style.color = "#6AB7AB";
                    (e.currentTarget as HTMLElement).style.borderColor = "#BFE9E2";
                  }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <motion.div key={col.title} variants={itemVariants}>
              <h4 className="font-karla font-bold text-xs text-[#3A6A4C] uppercase tracking-widest mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="font-karla text-sm text-[#6D8F7A] hover:text-[#1F4D2E] transition-colors duration-200 cursor-pointer"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact strip */}
        <div
          className="flex flex-wrap gap-6 py-6 mb-6"
          style={{ borderTop: "1px solid #BFE9E2" }}
        >
          <a
            href="mailto:contacto@vittareterapia.com"
            className="flex items-center gap-2 font-karla text-xs text-[#6D8F7A] hover:text-[#1F4D2E] transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-[#12A357]" />
            contacto@vittareterapia.com
          </a>
          <span className="flex items-center gap-2 font-karla text-xs text-[#6D8F7A]">
            <MapPin className="w-3.5 h-3.5 text-[#12A357]" />
            Ciudad de México, México
          </span>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid #BFE9E280" }}
        >
          <p className="font-karla text-xs text-[#6D8F7A]">
            © {new Date().getFullYear()} Vittare. Todos los derechos reservados.
          </p>
          <p className="font-karla italic text-xs text-[#6AB7AB]">
            "Reconecta Contigo"
          </p>
          <p className="font-karla text-xs text-[#6D8F7A]">
            En emergencias: Línea de la Vida{" "}
            <a
              href="tel:8009112000"
              className="text-[#12A357] hover:text-[#0F8A4A] transition-colors"
            >
              800 911 2000
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
