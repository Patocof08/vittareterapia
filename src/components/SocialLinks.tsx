interface SocialLinksProps {
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md";
}

// ACTUALIZAR estos links con los reales de Vittare
const SOCIAL_LINKS = [
  { name: "Instagram", url: "https://instagram.com/vittareterapia", icon: "📸" },
  { name: "TikTok", url: "https://tiktok.com/@vittareterapia", icon: "🎵" },
  { name: "LinkedIn", url: "https://linkedin.com/company/vittare", icon: "💼" },
  { name: "Facebook", url: "https://facebook.com/vittareterapia", icon: "👥" },
];

export const SocialLinks = ({ variant = "horizontal", size = "md" }: SocialLinksProps) => {
  return (
    <div className={`flex gap-3 ${variant === "vertical" ? "flex-col" : "flex-row flex-wrap items-center"}`}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors ${
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}
        >
          <span>{social.icon}</span>
          <span>{social.name}</span>
        </a>
      ))}
    </div>
  );
};
