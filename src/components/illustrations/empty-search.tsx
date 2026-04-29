interface Props { className?: string }

export default function IllustrationEmptySearch({ className }: Props) {
  return (
    <svg data-testid="illustration-empty-search" className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="52" cy="50" r="28" stroke="var(--primary)" strokeWidth="3" fill="var(--primary)" fillOpacity="0.06" />
      <line x1="72" y1="70" x2="100" y2="98" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
      {/* Question mark */}
      <path d="M46 40 C46 34 52 30 58 34 C62 37 58 42 52 44 L52 50" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="56" r="2" fill="var(--accent)" />
      {/* Sparkles around */}
      <path d="M20 25 L22 21 L24 25 L28 27 L24 29 L22 33 L20 29 L16 27 Z" fill="var(--rose)" fillOpacity="0.4" />
      <path d="M90 20 L91 17 L92 20 L95 21 L92 22 L91 25 L90 22 L87 21 Z" fill="var(--teal)" fillOpacity="0.4" />
      <circle cx="85" cy="80" r="3" fill="var(--accent)" fillOpacity="0.3" />
    </svg>
  );
}
