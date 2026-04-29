"use client";

import { useEffect, useRef } from "react";
import { IllustrationCamera, IllustrationParty, IllustrationHouse, IllustrationFilm } from "@/components/illustrations";

const steps = [
  {
    num: "01",
    title: "Разместите",
    desc: "Добавьте фото, описание, цену и правила вашего помещения. Публикация бесплатная — займёт 5 минут.",
    note: "← это бесплатно!",
    illustration: <IllustrationCamera className="w-48 h-48 sm:w-64 sm:h-64" />,
  },
  {
    num: "02",
    title: "Получите запрос",
    desc: "Арендаторы находят вас через каталог, фильтры и карту. Отправляют запрос на бронирование.",
    note: "без звонков!",
    illustration: <IllustrationParty className="w-48 h-48 sm:w-64 sm:h-64" />,
  },
  {
    num: "03",
    title: "Подтвердите",
    desc: "Примите бронирование — деньги замораживаются на escrow. Общайтесь с арендатором в чате.",
    note: "безопасно ✓",
    illustration: <IllustrationHouse className="w-48 h-48 sm:w-64 sm:h-64" />,
  },
  {
    num: "04",
    title: "Зарабатывайте",
    desc: "После мероприятия деньги поступают на ваш счёт за 3-5 дней. Отслеживайте доход в дашборде.",
    note: "быстрая выплата →",
    illustration: <IllustrationFilm className="w-48 h-48 sm:w-64 sm:h-64" />,
  },
];

export default function StickySteps() {
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
