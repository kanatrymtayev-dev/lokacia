interface Props { className?: string }

export default function IllustrationCutlery({ className }: Props) {
  return (
    <svg data-testid="illustration-cutlery" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Plate */}
      <ellipse cx="40" cy="48" rx="28" ry="18" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="var(--primary)" fillOpacity="0.06" />
      <ellipse cx="40" cy="48" rx="18" ry="11" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Fork */}
      <path d="M16 14 L16 35 M16 35 L16 65" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 14 L12 24 C12 28 16 28 16 28 C16 28 20 28 20 24 L20 14" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="14" x2="16" y2="24" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Knife */}
      <path d="M64 14 C64 14 68 20 68 30 C68 34 66 35 64 35 L64 65" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Decorative steam */}
      <path d="M35 32 C35 28 38 26 37 22" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M43 30 C43 26 46 24 45 20" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Heart on plate */}
      <path d="M37 44 C37 42 39 40 40 42 C41 40 43 42 43 44 C43 47 40 49 40 49 C40 49 37 47 37 44Z" fill="var(--rose)" fillOpacity="0.4" />
    </svg>
  );
}
