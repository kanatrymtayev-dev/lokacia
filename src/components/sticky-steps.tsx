"use client";

import { useEffect, useRef } from "react";
import { IllustrationCamera, IllustrationParty, IllustrationHouse, IllustrationFilm } from "@/components/illustrations";
import { useT } from "@/lib/i18n";

const illustrations = [
  <IllustrationCamera key="cam" className="w-48 h-48 sm:w-64 sm:h-64" />,
  <IllustrationParty key="party" className="w-48 h-48 sm:w-64 sm:h-64" />,
  <IllustrationHouse key="house" className="w-48 h-48 sm:w-64 sm:h-64" />,
  <IllustrationFilm key="film" className="w-48 h-48 sm:w-64 sm:h-64" />,
];

export default function StickySteps() {
  const { t } = useT();
  const steps = [1, 2, 3, 4].map((i) => ({
    num: `0${i}`,
    title: t(`steps.${i}.title`),
    desc: t(`steps.${i}.desc`),
    note: t(`steps.${i}.note`),
    illustration: illustrations[i - 1],
  }));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamic import GSAP to avoid SSR issues
    let ctx: { revert: () => void } | null = null;

    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        if (!containerRef.current) return;

        const sections = containerRef.current.querySelectorAll(".step-panel");

        ctx = gsap.context(() => {
          sections.forEach((section, i) => {
            if (i === 0) return; // First is visible by default

            gsap.fromTo(
              section,
              { opacity: 0, y: 60 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 75%",
                  toggleActions: "play none none none",
                },
              }
            );
          });
        }, containerRef);
      });
    });

    return () => ctx?.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-20 sm:space-y-32">
      {steps.map((step, i) => (
        <div
          key={step.num}
          className={`step-panel grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
            i % 2 === 1 ? "lg:direction-rtl" : ""
          }`}
        >
          {/* Text side */}
          <div className={i % 2 === 1 ? "lg:order-2" : ""}>
            <div className="text-7xl sm:text-8xl font-black text-primary/10 leading-none">
              {step.num}
            </div>
            <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-md">
              {step.desc}
            </p>
            <p className="font-handwritten text-xl text-primary mt-3 -rotate-1">
              {step.note}
            </p>
          </div>

          {/* Illustration side */}
          <div className={`flex justify-center ${i % 2 === 1 ? "lg:order-1" : ""}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full scale-110 blur-2xl" />
              <div className="relative animate-float" style={{ animationDelay: `${i * 200}ms` }}>
                {step.illustration}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
