interface Props { className?: string }

export default function IllustrationCamera({ className }: Props) {
  return (
    <svg data-testid="illustration-camera" className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="28" width="60" height="38" rx="8" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="var(--primary)" fillOpacity="0.08" />
      <path d="M28 28 L33 18 L47 18 L52 28" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="47" r="12" stroke="var(--primary)" strokeWidth="2.5" fill="var(--primary)" fillOpacity="0.12" />
      <circle cx="40" cy="47" r="6" fill="var(--accent)" fillOpacity="0.4" />
      <circle cx="57" cy="35" r="3" fill="var(--rose)" fillOpacity="0.6" />
      {/* Flash sparkle */}
      <path d="M62 18 L64 14 L66 18 L70 20 L66 22 L64 26 L62 22 L58 20 Z" fill="var(--accent)" fillOpacity="0.5" />
    </svg>
  );
}
