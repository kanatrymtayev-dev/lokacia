const variants = {
  verified: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  featured: "bg-amber-400 text-amber-950",
  new: "bg-accent text-gray-900",
  host: "bg-purple-100 text-purple-700",
  renter: "bg-blue-100 text-blue-700",
  danger: "bg-red-50 text-red-600",
  deactivated: "bg-orange-50 text-orange-600",
  info: "bg-blue-50 text-blue-600",
} as const;

interface BadgeProps {
  variant: keyof typeof variants;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  variant,
  children,
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${className}`}
    >
      {children}
    </span>
  );
}
