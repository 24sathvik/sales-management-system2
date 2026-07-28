import React from "react";

interface ZyOpsLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

export function ZyOpsLogo({
  size = "md",
  showWordmark = true,
  theme = "dark",
  className = "",
}: ZyOpsLogoProps) {
  // Dimension mapping
  const sizeMap = {
    sm: { svg: 24, textZy: "text-lg", textOps: "text-lg" },
    md: { svg: 32, textZy: "text-2xl", textOps: "text-2xl" },
    lg: { svg: 40, textZy: "text-3xl", textOps: "text-3xl" },
  };

  const currentSize = sizeMap[size];

  // Theme mapping for the "Zy" text. "Ops" is always accent color.
  const zyColor = theme === "dark" ? "text-white" : "text-[var(--text-heading)]";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG Mark */}
      <svg
        width={currentSize.svg}
        height={currentSize.svg}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient
            id="bg"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-primary-dark)" />
          </linearGradient>
          <linearGradient
            id="zy"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--brand-accent-light)" />
            <stop offset="100%" stopColor="var(--brand-accent)" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#bg)" />
        <rect x="9" y="10" width="16" height="3.5" rx="1.5" fill="url(#zy)" />
        <path
          d="M23 13.5 L11 26.5"
          stroke="url(#zy)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect x="9" y="26.5" width="16" height="3.5" rx="1.5" fill="url(#zy)" />
        <circle cx="31" cy="10" r="3" fill="var(--brand-accent)" opacity="0.85" />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div className="font-display font-[800] leading-none tracking-tight flex items-baseline">
          <span className={`${currentSize.textZy} ${zyColor}`}>Zy</span>
          <span className={`${currentSize.textOps} text-[var(--brand-primary)]`}>Ops</span>
        </div>
      )}
    </div>
  );
}
