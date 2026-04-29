interface Props { className?: string }

export default function IllustrationEmptyInbox({ className }: Props) {
  return (
    <svg data-testid="illustration-empty-inbox" className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Envelope */}
      <rect x="18" y="35" width="84" height="55" rx="6" stroke="var(--primary)" strokeWidth="3" fill="var(--primary)" fillOpacity="0.06" />
      {/* Envelope flap */}
      <path d="M18 35 L60 68 L102 35" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Paper flying out */}
      <rect x="38" y="15" width="44" height="30" rx="3" stroke="var(--primary)" strokeWidth="2" fill="white" fillOpacity="0.8" transform="rotate(-5 60 30)" />
      <line x1="45" y1="24" x2="68" y2="23" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      <line x1="45" y1="30" x2="62" y2="29" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      <line x1="45" y1="36" x2="72" y2="35" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      {/* Motion lines */}
      <line x1="85" y1="20" x2="95" y2="15" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="88" y1="28" x2="98" y2="25" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      {/* Sparkle */}
      <path d="M100 45 L102 41 L104 45 L108 47 L104 49 L102 53 L100 49 L96 47 Z" fill="var(--rose)" fillOpacity="0.3" />
    </svg>
  );
}
