interface Props { className?: string }

export default function IllustrationHouse({ className }: Props) {
  return (
    <svg data-testid="illustration-house" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Roof */}
      <path d="M10 40 L40 12 L70 40" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="var(--primary)" fillOpacity="0.08" />
      {/* Walls */}
      <rect x="18" y="40" width="44" height="30" rx="2" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="var(--warm)" fillOpacity="0.5" />
      {/* Door */}
      <rect x="34" y="50" width="12" height="20" rx="2" stroke="var(--primary)" strokeWidth="2" fill="var(--accent)" fillOpacity="0.2" />
      <circle cx="43" cy="61" r="1.5" fill="var(--accent)" />
      {/* Window */}
      <rect x="22" y="48" width="8" height="8" rx="1" stroke="var(--primary)" strokeWidth="1.5" fill="var(--teal)" fillOpacity="0.15" />
      <line x1="26" y1="48" x2="26" y2="56" stroke="var(--primary)" strokeWidth="1" />
      <line x1="22" y1="52" x2="30" y2="52" stroke="var(--primary)" strokeWidth="1" />
      {/* Chimney smoke */}
      <path d="M56 30 C56 24 60 22 58 16" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M59 28 C59 22 63 20 61 14" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      {/* Heart */}
      <path d="M54 48 C54 46 56 44 58 46 C60 44 62 46 62 48 C62 51 58 54 58 54 C58 54 54 51 54 48Z" fill="var(--rose)" fillOpacity="0.4" />
    </svg>
  );
}
