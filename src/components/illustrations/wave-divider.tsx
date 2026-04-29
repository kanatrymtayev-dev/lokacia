interface Props {
  className?: string;
  fill?: string;
  flip?: boolean;
}

export default function WaveDivider({ className = "", fill = "var(--background)", flip = false }: Props) {
  return (
    <svg
      data-testid="wave-divider"
      className={`w-full h-8 sm:h-12 block ${flip ? "rotate-180" : ""} ${className}`}
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 24 C240 4, 480 44, 720 24 C960 4, 1200 44, 1440 24 L1440 48 L0 48 Z"
        fill={fill}
      />
    </svg>
  );
}
