"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden">
        {/* Main image */}
        <button
          onClick={() => setLightbox(true)}
          className="relative aspect-[4/3] md:aspect-auto md:row-span-2 bg-gray-100 cursor-pointer overflow-hidden"
        >
          <Image
            src={images[0]}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </button>
        {/* Thumbnails */}
        {images.slice(1, 5).map((img, i) => (
          <button
            key={i}
            onClick={() => {
              setActive(i + 1);
              setLightbox(true);
            }}
            className="relative aspect-[4/3] bg-gray-100 cursor-pointer overflow-hidden hidden md:block"
          >
            <Image
              src={img}
              alt={`${title} — фото ${i + 2}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="25vw"
            />
            {i === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{images.length - 5}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
            onClick={() => setLightbox(false)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous */}
          <button
            className="absolute left-4 text-white/70 hover:text-white z-10"
            onClick={(e) => {
              e.stopPropagation();
              setActive((p) => (p > 0 ? p - 1 : images.length - 1));
            }}
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative w-full max-w-4xl aspect-[4/3] mx-12" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[active]}
              alt={`${title} — фото ${active + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          <button
            className="absolute right-4 text-white/70 hover:text-white z-10"
            onClick={(e) => {
              e.stopPropagation();
              setActive((p) => (p < images.length - 1 ? p + 1 : 0));
            }}
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
