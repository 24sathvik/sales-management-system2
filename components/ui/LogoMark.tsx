import React from 'react';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer rounded square background */}
      <rect width="32" height="32" rx="8" fill="var(--brand-primary)" />
      {/* Abstract "flow" mark — stylized P with flow lines */}
      {/* Top horizontal bar */}
      <rect x="8" y="8" width="14" height="4" rx="2" fill="var(--text-heading)" />
      {/* Vertical stem */}
      <rect x="8" y="8" width="4" height="16" rx="2" fill="var(--text-heading)" />
      {/* Curved bowl of P */}
      <path d="M12 12 Q22 12 22 16 Q22 20 12 20" 
            stroke="var(--text-heading)" strokeWidth="4" 
            fill="none" strokeLinecap="round" />
      {/* Flow accent line */}
      <rect x="8" y="26" width="16" height="2" rx="1" 
            fill="var(--text-heading)" opacity="0.4" />
    </svg>
  );
}
