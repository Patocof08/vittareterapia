import { cn } from "@/lib/utils";

interface VittareLogoProps {
  showWordmark?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** Isotipo SVG — igual al de la barra de navegación */
export const VittareIsotipo = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-9 h-9 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M20 4C20 4 27 10 27 18C27 22 24 26 20 26C16 26 13 22 13 18C13 10 20 4 20 4Z"
      fill="#12A357"
      opacity="0.55"
    />
    <path
      d="M36 20C36 20 30 27 22 27C18 27 14 24 14 20C14 16 18 13 22 13C30 13 36 20 36 20Z"
      fill="#12A357"
      opacity="0.55"
    />
    <path
      d="M20 36C20 36 13 30 13 22C13 18 16 14 20 14C24 14 27 18 27 22C27 30 20 36 20 36Z"
      fill="#12A357"
      opacity="0.55"
    />
    <path
      d="M4 20C4 20 10 13 18 13C22 13 26 16 26 20C26 24 22 27 18 27C10 27 4 20 4 20Z"
      fill="#12A357"
      opacity="0.55"
    />
    <path
      d="M20 27C17 24 14 21 14 18.5C14 16.5 16 15 17.5 16L20 19L22.5 16C24 15 26 16.5 26 18.5C26 21 23 24 20 27Z"
      fill="#1F4D2E"
    />
  </svg>
);

/** Logo completo: isotipo + wordmark "vittare" + "Reconecta Contigo" */
export const VittareLogo = ({
  showWordmark = true,
  size = "md",
  className,
}: VittareLogoProps) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <VittareIsotipo className={size === "sm" ? "w-7 h-7" : "w-9 h-9"} />
    {showWordmark && (
      <div>
        <div
          className={cn(
            "font-display text-[#1F4D2E] leading-none tracking-tight",
            size === "sm" ? "text-base" : "text-xl"
          )}
        >
          vittare
        </div>
        <div
          className={cn(
            "font-karla text-[#6D8F7A] uppercase tracking-[0.18em] leading-none mt-0.5",
            size === "sm" ? "text-[7px]" : "text-[8px]"
          )}
        >
          Reconecta Contigo
        </div>
      </div>
    )}
  </div>
);
