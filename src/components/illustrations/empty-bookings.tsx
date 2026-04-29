interface Props { className?: string }

export default function IllustrationEmptyBookings({ className }: Props) {
  return (
    <svg data-testid="illustration-empty-bookings" className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar */}
      <rect x="20" y="28" width="80" height="72" rx="8" stroke="var(--primary)" strokeWidth="3" fill="var(--primary)" fillOpacity="0.06" />
      {/* Calendar header */}
      <rect x="20" y="28" width="80" height="20" rx="8" fill="var(--primary)" fillOpacity="0.12" />
      {/* Rings */}
      <line x1="42" y1="20" x2="42" y2="36" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <line x1="78" y1="20" x2="78" y2="36" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      {/* Empty grid dots */}
      <circle cx="38" cy="62" r="3" fill="var(--primary)" fillOpacity="0.1" />
      <circle cx="60" cy="62" r="3" fill="var(--primary)" fillOpacity="0.1" />
      <circle cx="82" cy="62" r="3" fill="var(--primary)" fillOpacity="0.1" />
      <circle cx="38" cy="82" r="3" fill="var(--primary)" fillOpacity="0.1" />
      <circle cx="60" cy="82" r="3" fill="var(--primary)" fillOpacity="0.1" />
      <circle cx="82" cy="82" r="3" fill="var(--primary)" fillOpacity="0.1" />
      {/* Sad face on calendar */}
      <circle cx="52" cy="72" r="1.5" fill="var(--accent)" fillOpacity="0.5" />
      <circle cx="68" cy="72" r="1.5" fill="var(--accent)" fillOpacity="0.5" />
      <path d="M52 80 C55 78 65 78 68 80" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
