interface Props { className?: string }

export default function IllustrationMountain({ className }: Props) {
  return (
    <svg data-testid="illustration-mountain" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Big mountain */}
      <path d="M5 65 L35 15 L65 65" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="var(--primary)" fillOpacity="0.08" />
      {/* Snow cap */}
      <path d="M28 28 L35 15 L42 28 L38 25 L35 28 L32 25 Z" fill="white" fillOpacity="0.8" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Small mountain */}
      <path d="M45 65 L62 35 L78 65" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="var(--teal)" fillOpacity="0.08" />
      {/* Sun */}
      <circle cx="68" cy="18" r="8" fill="var(--accent)" fillOpacity="0.3" stroke="var(--accent)" strokeWidth="1.5" />
      {/* Sun rays */}
      <line x1="68" y1="6" x2="68" y2="2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="78" y1="18" x2="80" y2="18" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="75" y1="11" x2="78" y2="8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Cloud */}
      <path d="M10 22 C10 18 14 16 17 18 C18 14 24 14 25 18 C28 16 32 18 32 22 C32 24 28 26 21 26 C14 26 10 24 10 22Z" fill="white" fillOpacity="0.5" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
      {/* Pine trees */}
      <path d="M12 65 L16 52 L20 65" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M68 65 L71 55 L74 65" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
