"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

interface CountUpProps {
  end: string;
  duration?: number;
  className?: string;
}

export default function CountUp({ end, duration = 2, className }: CountUpProps) {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const [display, setDisplay] = useState(end);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    // Extract numeric part and suffix (e.g. "500+" → 500, "+")
    const match = end.match(/^([\d,.]+)(.*)$/);
    if (!match) return;

    const target = parseFloat(match[1].replace(/,/g, ""));
    const suffix = match[2];
    const isDecimal = match[1].includes(".");
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (isDecimal) {
        setDisplay(current.toFixed(1) + suffix);
      } else {
        setDisplay(Math.floor(current).toLocaleString("ru-RU") + suffix);
      }

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
