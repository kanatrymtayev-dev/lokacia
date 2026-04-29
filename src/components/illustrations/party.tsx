interface Props { className?: string }

export default function IllustrationParty({ className }: Props) {
  return (
    <svg data-testid="illustration-party" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Balloon 1 */}
      <ellipse cx="28" cy="30" rx="12" ry="15" fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2" />
      <path d="M28 45 L28 65" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Balloon 2 */}
      <ellipse cx="48" cy="25" rx="10" ry="13" fill="var(--rose)" fillOpacity="0.3" stroke="var(--rose)" strokeWidth="2" />
      <path d="M48 38 L46 62" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Balloon 3 */}
      <ellipse cx="62" cy="32" rx="9" ry="11" fill="var(--accent)" fillOpacity="0.25" stroke="var(--accent)" strokeWidth="2" />
      <path d="M62 43 L60 60" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Confetti */}
      <rect x="15" y="10" width="4" height="4" rx="1" fill="var(--accent)" fillOpacity="0.6" transform="rotate(15 17 12)" />
      <rect x="55" y="8" width="3" height="3" rx="1" fill="var(--teal)" fillOpacity="0.6" transform="rotate(-20 56 9)" />
      <circle cx="38" cy="12" r="2" fill="var(--rose)" fillOpacity="0.5" />
      <rect x="70" y="18" width="3" height="5" rx="1" fill="var(--primary)" fillOpacity="0.4" transform="rotate(30 71 20)" />
    </svg>
  );
}
