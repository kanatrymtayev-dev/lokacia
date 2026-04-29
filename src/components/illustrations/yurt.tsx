interface Props { className?: string }

export default function IllustrationYurt({ className }: Props) {
  return (
    <svg data-testid="illustration-yurt" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dome */}
      <path d="M8 55 C8 55 20 20 40 20 C60 20 72 55 72 55" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="var(--warm)" fillOpacity="0.5" />
      {/* Base */}
      <line x1="8" y1="55" x2="72" y2="55" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Door */}
      <path d="M33 55 L33 40 C33 37 40 34 40 34 C40 34 47 37 47 40 L47 55" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" fill="var(--accent)" fillOpacity="0.15" />
      {/* Crown / Shanyrak */}
      <circle cx="40" cy="20" r="5" stroke="var(--accent)" strokeWidth="2" fill="var(--accent)" fillOpacity="0.2" />
      <line x1="40" y1="15" x2="40" y2="25" stroke="var(--accent)" strokeWidth="1.5" />
      <line x1="35" y1="20" x2="45" y2="20" stroke="var(--accent)" strokeWidth="1.5" />
      {/* Decorative pattern */}
      <path d="M22 42 C25 40 28 42 31 40" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M49 42 C52 40 55 42 58 40" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Ground grass */}
      <path d="M4 58 C8 55 12 58 16 55 C20 58 24 55 28 58" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
