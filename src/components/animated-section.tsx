"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-in-up" | "fade-in-scale";
  delay?: string;
}

export default function AnimatedSection({
  children,
  className = "",
  animation = "fade-in-up",
  delay,
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  const animClass = animation === "fade-in-scale"
    ? "animate-fade-in-scale"
    : "animate-fade-in-up";

  return (
    <div
      ref={ref}
      className={`${className} ${isInView ? animClass : "opacity-0"}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      {children}
    </div>
  );
}
