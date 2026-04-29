interface Props { className?: string }

export default function IllustrationDesk({ className }: Props) {
  return (
    <svg data-testid="illustration-desk" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Desk surface */}
      <rect x="8" y="45" width="64" height="6" rx="2" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="var(--primary)" fillOpacity="0.08" />
      {/* Desk legs */}
      <line x1="14" y1="51" x2="14" y2="70" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="66" y1="51" x2="66" y2="70" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Laptop base */}
      <rect x="24" y="32" width="28" height="13" rx="2" stroke="var(--primary)" strokeWidth="2" fill="var(--teal)" fillOpacity="0.1" />
      {/* Laptop screen */}
      <rect x="22" y="14" width="32" height="18" rx="2" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.1" />
      {/* Screen content */}
      <line x1="28" y1="20" x2="42" y2="20" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="28" y1="24" x2="36" y2="24" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="28" y1="28" x2="46" y2="28" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Coffee cup */}
      <rect x="58" y="36" width="10" height="9" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="var(--warm)" fillOpacity="0.6" />
      <path d="M68 39 C72 39 72 42 68 42" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Steam */}
      <path d="M62 32 C62 28 64 27 63 24" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}
