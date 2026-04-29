interface Props { className?: string }

export default function IllustrationEmptyFavorites({ className }: Props) {
  return (
    <svg data-testid="illustration-empty-favorites" className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dashed heart */}
      <path d="M60 100 C60 100 20 72 20 45 C20 30 32 22 44 28 C52 32 57 38 60 44 C63 38 68 32 76 28 C88 22 100 30 100 45 C100 72 60 100 60 100Z" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" fill="var(--rose)" fillOpacity="0.08" />
      {/* Small solid heart */}
      <path d="M55 55 C55 51 59 49 60 52 C61 49 65 51 65 55 C65 60 60 63 60 63 C60 63 55 60 55 55Z" fill="var(--rose)" fillOpacity="0.4" />
      {/* Sparkles */}
      <path d="M30 30 L32 26 L34 30 L38 32 L34 34 L32 38 L30 34 L26 32 Z" fill="var(--accent)" fillOpacity="0.3" />
      <path d="M88 25 L89 22 L90 25 L93 26 L90 27 L89 30 L88 27 L85 26 Z" fill="var(--teal)" fillOpacity="0.4" />
      <circle cx="92" cy="75" r="3" fill="var(--accent)" fillOpacity="0.2" />
    </svg>
  );
}
