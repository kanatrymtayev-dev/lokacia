interface Props { className?: string }

export default function IllustrationFilm({ className }: Props) {
  return (
    <svg data-testid="illustration-film" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clapperboard base */}
      <rect x="10" y="30" width="55" height="38" rx="4" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="var(--primary)" fillOpacity="0.08" />
      {/* Clapper top */}
      <path d="M10 30 L65 30 L58 16 L3 16 Z" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="var(--accent)" fillOpacity="0.15" />
      {/* Stripes on clapper */}
      <line x1="20" y1="16" x2="23" y2="30" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="16" x2="35" y2="30" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="16" x2="47" y2="30" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      {/* Text lines */}
      <line x1="18" y1="42" x2="42" y2="42" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="18" y1="50" x2="35" y2="50" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Star */}
      <path d="M56 48 L58 44 L60 48 L64 49 L60 51 L58 55 L56 51 L52 49 Z" fill="var(--accent)" fillOpacity="0.5" />
    </svg>
  );
}
