"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback((index: number) => {
    setActive(index);
    if (scrollRef.current) {
      const child = scrollRef.current.children[index] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, []);

  const hasMultiple = images.length > 1;

  return (
    <>
      {/* Mobile: horizontal scroll carousel */}
      <div className="md:hidden relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 rounded-2xl"
          onScroll={(e) => {
            const el = e.currentTarget;
            const index = Math.round(el.scrollLeft / el.clientWidth);
            if (index !== active && index >= 0 && index < images.length) {
              setActive(index);
            }
          }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setLightbox(true); }}
              className="relative flex-shrink-0 w-full aspect-[3/2] snap-center bg-gray-100"
            >
              {img && typeof img === "string" && img.trim() !== "" ? (
                <Image
                  src={img}
                  alt={`${title} — фото ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-gray-400">Нет фото</span>
              )}
            </button>
          ))}
        </div>

        {/* Dots */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === active ? "bg-white w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        {hasMultiple && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            {active + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Desktop: grid layout */}
      <div className="hidden md:grid grid-cols-2 gap-2 rounded-2xl overflow-hidden" style={{ height: 420 }}>
        {/* Main image */}
        <button
          onClick={() => { setActive(0); setLightbox(true); }}
          className="relative bg-gray-100 cursor-pointer overflow-hidden row-span-2"
        >
          {images[0] && typeof images[0] === "string" && images[0].trim() !== "" ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="50vw"
              priority
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-gray-400">Нет фото</span>
          )}
        </button>

        {/* Thumbnails */}
        {images.slice(1, 5).map((img, i) => (
          <button
            key={i}
            onClick={() => { setActive(i + 1); setLightbox(true); }}
            className="relative bg-gray-100 cursor-pointer overflow-hidden"
          >
            {img && typeof img === "string" && img.trim() !== "" ? (
              <Image
                src={img}
                alt={`${title} — фото ${i + 2}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="25vw"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-gray-400 text-xs">Нет фото</span>
            )}
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{images.length - 5}</span>
              </div>
            )}
          </button>
        ))}

        {/* Fill empty slots if < 5 images */}
        {images.length === 1 && (
          <div className="bg-gray-50 row-span-2 flex items-center justify-center text-gray-300 text-sm">
            Одно фото
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            onClick={() => setLightbox(false)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous */}
          {hasMultiple && (
            <button
              className="absolute left-2 sm:left-4 text-white/70 hover:text-white z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActive((p) => (p > 0 ? p - 1 : images.length - 1));
              }}
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-4xl aspect-[4/3] mx-12"
            onClick={(e) => e.stopPropagation()}
          >
            {images[active] && typeof images[active] === "string" && images[active].trim() !== "" ? (
              <Image
                src={images[active]}
                alt={`${title} — фото ${active + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-white/50">Нет фото</span>
            )}
          </div>

          {/* Next */}
          {hasMultiple && (
            <button
              className="absolute right-2 sm:right-4 text-white/70 hover:text-white z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setActive((p) => (p < images.length - 1 ? p + 1 : 0));
              }}
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Hide scrollbar */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
