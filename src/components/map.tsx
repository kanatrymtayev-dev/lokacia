"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

// 2GIS MapGL загружается через CDN: https://docs.2gis.com/ru/mapgl/overview
// Ключ можно положить в .env.local как NEXT_PUBLIC_2GIS_KEY. Демо-ключ работает с ограничениями.
const MAPGL_SRC = "https://mapgl.2gis.com/api/js/v1";
const API_KEY = process.env.NEXT_PUBLIC_2GIS_KEY ?? "042b5b75-f847-4f2a-b695-b5f58adc9dfd"; // публичный demo-key из доков 2GIS

type MapglMarker = {
  destroy(): void;
  setIcon(opts: { icon: string; size?: [number, number]; anchor?: [number, number] }): void;
};

type MapglMap = {
  destroy(): void;
  fitBounds(b: { northEast: [number, number]; southWest: [number, number] }, opts?: { padding?: { top: number; right: number; bottom: number; left: number } }): void;
  setCenter(coords: [number, number]): void;
  setZoom(z: number): void;
  on(event: string, cb: (...args: unknown[]) => void): void;
};

interface MapglApi {
  Map: new (
    container: HTMLElement,
    opts: { center: [number, number]; zoom: number; key: string; minZoom?: number; maxZoom?: number; zoomControl?: string }
  ) => MapglMap;
  Marker: new (
    map: MapglMap,
    opts: { coordinates: [number, number]; icon?: string; size?: [number, number]; anchor?: [number, number] }
  ) => MapglMarker;
  HtmlMarker: new (
    map: MapglMap,
    opts: { coordinates: [number, number]; html: string; anchor?: [number, number] }
  ) => MapglMarker;
}

declare global {
  interface Window {
    mapgl?: MapglApi;
    __mapgl_loader__?: Promise<MapglApi>;
  }
}

function loadMapgl(): Promise<MapglApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.mapgl) return Promise.resolve(window.mapgl);
  if (window.__mapgl_loader__) return window.__mapgl_loader__;

  window.__mapgl_loader__ = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MAPGL_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => window.mapgl ? resolve(window.mapgl) : reject(new Error("mapgl missing")));
      return;
    }
    const s = document.createElement("script");
    s.src = MAPGL_SRC;
    s.async = true;
    s.onload = () => (window.mapgl ? resolve(window.mapgl) : reject(new Error("mapgl missing")));
    s.onerror = () => reject(new Error("Не удалось загрузить 2GIS MapGL"));
    document.head.appendChild(s);
  });

  return window.__mapgl_loader__;
}

function pinHtml(price: string, highlighted: boolean) {
  const bg = highlighted ? "#111827" : "#ffffff";
  const fg = highlighted ? "#ffffff" : "#111827";
  const border = highlighted ? "#111827" : "rgba(0,0,0,0.12)";
  const scale = highlighted ? "scale(1.12)" : "scale(1)";
  return `
    <div style="
      background:${bg};
      color:${fg};
      border:1px solid ${border};
      box-shadow:0 4px 14px rgba(0,0,0,${highlighted ? 0.25 : 0.15});
      padding:6px 10px;
      border-radius:9999px;
      font-weight:700;
      font-size:12px;
      white-space:nowrap;
      transform:${scale};
      transform-origin:center bottom;
      transition:transform .15s ease, background-color .15s ease, color .15s ease;
      font-family:ui-sans-serif,system-ui,-apple-system;
      cursor:pointer;
    ">${price}</div>
  `;
}

export default function Map2GIS({
  listings,
  hoveredListingId,
  className = "",
}: {
  listings: Listing[];
  hoveredListingId?: string | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapglMap | null>(null);
  const markersRef = useRef<Map<string, MapglMarker>>(new Map());
  const apiRef = useRef<MapglApi | null>(null);
  const [errorState, setError] = useState<string | null>(null);

  // Инициализация карты один раз
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadMapgl()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        apiRef.current = api;

        // Стартовый центр — Алматы по умолчанию
        const initial: [number, number] = listings.length > 0 && listings[0].lng && listings[0].lat
          ? [listings[0].lng, listings[0].lat]
          : [76.945465, 43.238949];

        mapRef.current = new api.Map(containerRef.current, {
          center: initial,
          zoom: 11,
          key: API_KEY,
          zoomControl: "topRight",
        });
      })
      .catch((e: Error) => setError(e.message));

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.destroy());
      markersRef.current.clear();
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Перерисовка маркеров и автомасштабирование при изменении listings
  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (!api || !map) return;

    // удаляем старые
    markersRef.current.forEach((m) => m.destroy());
    markersRef.current.clear();

    // Если координаты отсутствуют (моковые данные 0, 0), покажем дефолтную Алмату для теста
    const valid = listings.map(l => {
      if (l.lat === 0 || l.lng === 0 || !Number.isFinite(l.lat) || !Number.isFinite(l.lng)) {
        return { ...l, lat: 43.238949, lng: 76.945465 };
      }
      return l;
    });

    for (const l of valid) {
      const marker = new api.HtmlMarker(map, {
        coordinates: [l.lng, l.lat],
        html: pinHtml(formatPrice(l.pricePerHour), l.id === hoveredListingId),
        anchor: [0.5, 1],
      });
      // открыть карточку по клику
      const el = (marker as unknown as { getContent?: () => HTMLElement }).getContent?.();
      if (el) {
        el.addEventListener("click", () => {
          window.location.href = `/listing/${l.slug}`;
        });
      }
      markersRef.current.set(l.id, marker);
    }

    // Автомасштабирование под все точки
    if (valid.length === 1) {
      map.setCenter([valid[0].lng, valid[0].lat]);
      map.setZoom(13);
    } else {
      const lats = valid.map((l) => l.lat);
      const lngs = valid.map((l) => l.lng);
      map.fitBounds(
        {
          southWest: [Math.min(...lngs), Math.min(...lats)],
          northEast: [Math.max(...lngs), Math.max(...lats)],
        },
        { padding: { top: 60, right: 60, bottom: 60, left: 60 } }
      );
    }
  }, [listings, hoveredListingId]);

  // Подсветка ховеренного маркера — пересоздаём только его HTML (HtmlMarker не имеет setHtml в публичном API во всех версиях)
  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (!api || !map) return;

    listings.forEach((l) => {
      const old = markersRef.current.get(l.id);
      if (!old) return;
      old.destroy();
      const marker = new api.HtmlMarker(map, {
        coordinates: [l.lng, l.lat],
        html: pinHtml(formatPrice(l.pricePerHour), l.id === hoveredListingId),
        anchor: [0.5, 1],
      });
      const el = (marker as unknown as { getContent?: () => HTMLElement }).getContent?.();
      if (el) {
        el.addEventListener("click", () => {
          window.location.href = `/listing/${l.slug}`;
        });
      }
      markersRef.current.set(l.id, marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredListingId]);

  return (
    <div className={`relative w-full h-full bg-gray-100 ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {errorState && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-50">
          <div className="text-center text-sm text-gray-500 max-w-xs">
            Не удалось загрузить карту 2GIS. {errorState}
            <div className="mt-2">
              <Link href="/catalog" className="text-primary hover:underline">Обновить</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

