import { cn } from "@/lib/utils";

interface VittareLogoProps {
  variant?: "default" | "dark" | "icon-only";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: 24, wordmark: 14, sub: 8 },
  md: { icon: 32, wordmark: 18, sub: 10 },
  lg: { icon: 48, wordmark: 24, sub: 12 },
};

export const VittareLogo = ({
  variant = "default",
  size = "md",
  className,
}: VittareLogoProps) => {
  const s = sizeMap[size];
  const isDark = variant === "dark";
  const isotopeColor = isDark ? "white" : "#12A357";
  const wordmarkColor = isDark ? "white" : "#1F4D2E";
  const taglineColor = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const heartColor = isDark ? "rgba(255,255,255,0.85)" : "white";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Isotipo — flor orgánica con corazón */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Pétalo superior */}
        <path
          d="M 20 20 C 15 19, 13 12, 20 7 C 27 12, 25 19, 20 20 Z"
          fill={isotopeColor}
        />
        {/* Pétalo derecho */}
        <path
          d="M 20 20 C 21 15, 28 13, 33 20 C 28 27, 21 25, 20 20 Z"
          fill={isotopeColor}
        />
        {/* Pétalo inferior */}
        <path
          d="M 20 20 C 25 21, 27 28, 20 33 C 13 28, 15 21, 20 20 Z"
          fill={isotopeColor}
        />
        {/* Pétalo izquierdo */}
        <path
          d="M 20 20 C 19 25, 12 27, 7 20 C 12 13, 19 15, 20 20 Z"
          fill={isotopeColor}
        />
        {/* Corazón central — ligeramente inclinado */}
        <g transform="rotate(-12 20 20)">
          <path
            d="M 20 23 C 17 21, 14 18.5, 14 16.5 C 14 14.5, 15.5 13.5, 17.3 14.3 C 18.4 14.8, 20 16.2, 20 16.2 C 20 16.2, 21.6 14.8, 22.7 14.3 C 24.5 13.5, 26 14.5, 26 16.5 C 26 18.5, 23 21, 20 23 Z"
            fill={heartColor}
          />
        </g>
      </svg>

      {/* Wordmark — solo si variant !== "icon-only" */}
      {variant !== "icon-only" && (
        <div className="flex flex-col leading-none gap-0.5">
          <span
            style={{
              fontFamily: "var(--cal-font-display, Georgia, serif)",
              fontSize: s.wordmark,
              color: wordmarkColor,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            vittare
          </span>
          <span
            style={{
              fontFamily: "var(--cal-font-body, 'Karla', sans-serif)",
              fontSize: s.sub,
              color: taglineColor,
              fontWeight: 400,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            reconecta contigo
          </span>
        </div>
      )}
    </div>
  );
};
