interface Props { className?: string }

export default function IllustrationErrorPin({ className }: Props) {
  return (
    <svg data-testid="illustration-error-pin" className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pin body */}
      <path d="M60 110 C60 110 95 72 95 48 C95 28 80 12 60 12 C40 12 25 28 25 48 C25 72 60 110 60 110Z" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" fill="var(--primary)" fillOpacity="0.08" />
      <circle cx="60" cy="48" r="16" fill="var(--primary)" fillOpacity="0.12" stroke="var(--primary)" strokeWidth="2" />
      {/* Confused face */}
      <circle cx="53" cy="44" r="2.5" fill="var(--primary)" fillOpacity="0.5" />
      <circle cx="67" cy="44" r="2.5" fill="var(--primary)" fillOpacity="0.5" />
      <path d="M52 56 C55 52 65 52 68 56" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Question marks */}
      <text x="85" y="30" fontSize="18" fill="var(--accent)" fillOpacity="0.5" fontFamily="sans-serif" fontWeight="bold">?</text>
      <text x="22" y="38" fontSize="14" fill="var(--rose)" fillOpacity="0.4" fontFamily="sans-serif" fontWeight="bold">?</text>
      {/* Sparkle */}
      <path d="M95 65 L97 61 L99 65 L103 67 L99 69 L97 73 L95 69 L91 67 Z" fill="var(--teal)" fillOpacity="0.3" />
    </svg>
  );
}
