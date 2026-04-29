/** Floating doodle decorations for the Hero section — camera, star, pin, sparkles */
interface Props { className?: string }

function DoodleCamera({ className }: Props) {
  return (
    <svg data-testid="doodle-camera" className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="20" width="48" height="32" rx="6" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "url(#wobbly)" }} />
      <path d="M22 20 L26 12 L38 12 L42 20" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="36" r="10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="36" r="5" fill="var(--accent)" opacity="0.3" />
      <circle cx="48" cy="27" r="2.5" fill="var(--accent)" opacity="0.6" />
    </svg>
  );
}

function DoodleStar({ className }: Props) {
  return (
    <svg data-testid="doodle-star" className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4 L28 18 L42 18 L30 26 L34 40 L24 31 L14 40 L18 26 L6 18 L20 18 Z" stroke="var(--rose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="var(--rose)" fillOpacity="0.15" />
    </svg>
  );
}

function DoodlePin({ className }: Props) {
  return (
    <svg data-testid="doodle-pin" className={className} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 58 C24 58 42 36 42 22 C42 12 34 4 24 4 C14 4 6 12 6 22 C6 36 24 58 24 58Z" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="var(--teal)" fillOpacity="0.15" />
      <circle cx="24" cy="22" r="7" stroke="var(--teal)" strokeWidth="2.5" fill="var(--teal)" fillOpacity="0.25" />
    </svg>
  );
}

function Sparkle({ className }: Props) {
  return (
    <svg data-testid="doodle-sparkle" className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L13 9 L20 8 L14 12 L20 16 L13 15 L12 22 L11 15 L4 16 L10 12 L4 8 L11 9 Z" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

export default function HeroDecor() {
  return (
    <>
      {/* Camera — top right */}
      <DoodleCamera className="absolute -top-4 right-[10%] w-16 h-16 opacity-60 animate-float" />
      {/* Star — top left */}
      <DoodleStar className="absolute top-8 left-[8%] w-10 h-10 opacity-50 animate-float-slow" />
      {/* Pin — bottom right */}
      <DoodlePin className="absolute bottom-12 right-[15%] w-10 h-14 opacity-50 animate-float-delay" />
      {/* Sparkles */}
      <Sparkle className="absolute top-1/4 right-[5%] w-6 h-6 animate-sparkle" />
      <Sparkle className="absolute top-1/3 left-[12%] w-5 h-5 animate-sparkle-delay" />
      <Sparkle className="absolute bottom-1/4 left-[20%] w-4 h-4 animate-sparkle-delay-2" />
    </>
  );
}
