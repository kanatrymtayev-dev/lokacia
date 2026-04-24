import type { ReactNode, HTMLAttributes } from "react";

const variants = {
  default: "border-gray-200",
  highlighted: "border-primary shadow-lg shadow-primary/10",
  danger: "border-red-200",
} as const;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  variant = "default",
  hover = false,
  padding = "md",
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border ${variants[variant]} ${paddings[padding]} ${
        hover
          ? "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
