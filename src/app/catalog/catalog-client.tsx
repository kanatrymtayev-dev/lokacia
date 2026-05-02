"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { Listing, City, SpaceType, ActivityType } from "@/lib/types";
import {
  CITY_LABELS,
  SPACE_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/types";
import ListingCard from "@/components/listing-card";
import { useAuth } from "@/lib/auth-context";
import { addFavorite, removeFavorite, getFavoriteIds } from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n";

// Карта — только на клиенте, без SSR (внутри идёт обращение к window)
const Map2GIS = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />,
});

const allCities = Object.entries(CITY_LABELS) as [City, string][];
const allSpaceTypes = Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][];
const allActivityTypes = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][];

const MAX_COMPARE = 3;

export default function CatalogClient({ listings }: { listings: Listing[] }) {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">Загрузка...</div>}>
      <CatalogInner listings={listings} />
    </Suspense>
  );
}

function CatalogInner({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useT();

  // ── URL-state фильтров ────────────────────────────────
  const search = searchParams.get("q") ?? "";
  const city = (searchParams.get("city") ?? "") as City | "";
  const spaceType = (searchParams.get("type") ?? "") as SpaceType | "";
  const activityType = (searchParams.get("activity") ?? "") as ActivityType | "";
  const instantOnly = searchParams.get("instant") === "1";
  const superhostOnly = searchParams.get("super") === "1";
  const maxPrice = Number(searchParams.get("maxPrice") ?? 0) || 0;
  const powerMin = Number(searchParams.get("powerMin") ?? 0) || 0;
  const parkingMin = Number(searchParams.get("parkingMin") ?? 0) || 0;
  const freight = searchParams.get("freight") === "1";
  const dock = searchParams.get("dock") === "1";
  const cyc = searchParams.get("cyc") === "1";

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "0") sp.delete(key);
      else sp.set(key, value);
      const qs = sp.toString();
      router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
    },
    [searchParams, router]
  );

  function clearFilters() {
    router.replace("/catalog", { scroll: false });
  }

  // ── Локальный UI-стейт ────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  // ── Favorites ─────────────────────────────────────────
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) { setFavorites(new Set()); return; }
    getFavoriteIds(user.id).then(setFavorites);
  }, [user]);

  async function handleToggleFavorite(listingId: string) {
    if (!user) {
      router.push(`/login?next=/catalog?${searchParams.toString()}`);
      return;
    }
    const isFav = favorites.has(listingId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    if (isFav) await removeFavorite(user.id, listingId);
    else await addFavorite(user.id, listingId);
  }

  // ── Compare ───────────────────────────────────────────
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [compareToast, setCompareToast] = useState<string | null>(null);

  function handleToggleCompare(listingId: string) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else if (next.size >= MAX_COMPARE) {
        setCompareToast(`Можно сравнить максимум ${MAX_COMPARE} локации`);
        setTimeout(() => setCompareToast(null), 2500);
        return prev;
      } else {
        next.add(listingId);
      }
      return next;
    });
  }

  function goToCompare() {
    const ids = Array.from(compareSet).join(",");
    router.push(`/compare?ids=${ids}`);
  }

  // ── Фильтрация ────────────────────────────────────────
  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${l.title} ${l.description} ${l.district} ${l.amenities.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (city && l.city !== city) return false;
      if (spaceType && l.spaceType !== spaceType) return false;
      if (activityType && !l.activityTypes.includes(activityType)) return false;
      if (instantOnly && !l.instantBook) return false;
      if (superhostOnly && !l.superhost) return false;
      if (maxPrice > 0 && l.pricePerHour > maxPrice) return false;
      if (powerMin > 0 && (!l.powerKw || l.powerKw < powerMin)) return false;
      if (parkingMin > 0 && (!l.parkingCapacity || l.parkingCapacity < parkingMin)) return false;
      if (freight && !l.hasFreightAccess) return false;
      if (dock && !l.hasLoadingDock) return false;
      if (cyc && !l.hasWhiteCyc) return false;
      return true;
    });
  }, [listings, search, city, spaceType, activityType, instantOnly, superhostOnly, maxPrice, powerMin, parkingMin, freight, dock, cyc]);

  const activeFilterCount = [city, spaceType, activityType, instantOnly, superhostOnly, maxPrice > 0, powerMin > 0, parkingMin > 0, freight, dock, cyc].filter(Boolean).length;

  const compareListings = useMemo(
    () => listings.filter((l) => compareSet.has(l.id)),
    [listings, compareSet]
  );

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] lg:overflow-hidden">
      {/* LEFT */}
      <section className="w-full lg:w-3/5 xl:w-[62%] lg:overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Каталог локаций</h1>
            <p className="mt-1 text-sm text-gray-600">
              Найдите идеальное пространство для вашего проекта
            </p>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder={t("catalog.searchPh")}
                value={search}
                onChange={(e) => updateParam("q", e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 hover:border-primary/30 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 bg-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Фильтры
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                  <select
                    value={city}
                    onChange={(e) => updateParam("city", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                  >
                    <option value="">Все города</option>
                    {allCities.map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип помещения</label>
                  <select
                    value={spaceType}
                    onChange={(e) => updateParam("type", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                  >
                    <option value="">Все типы</option>
                    {allSpaceTypes.map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Активность</label>
                  <select
                    value={activityType}
                    onChange={(e) => updateParam("activity", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                  >
                    <option value="">Все</option>
                    {allActivityTypes.map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Макс. цена/час {maxPrice > 0 && `— ${maxPrice.toLocaleString("ru-RU")} ₸`}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={60000}
                    step={1000}
                    value={maxPrice}
                    onChange={(e) => updateParam("maxPrice", e.target.value)}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={instantOnly}
                    onChange={(e) => updateParam("instant", e.target.checked ? "1" : null)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span className="text-sm flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0 0 9.514.757l-6 9A1 1 0 0 0 4.348 11.5h3.735l-.73 6.454a1 1 0 0 0 1.786.71l6-9a1 1 0 0 0-.835-1.614H10.57l.73-6.004Z" />
                    </svg>
                    Мгновенное бронирование
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={superhostOnly}
                    onChange={(e) => updateParam("super", e.target.checked ? "1" : null)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span className="text-sm">Суперхосты</span>
                </label>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-primary hover:underline ml-auto">
                    {t("catalog.resetFilters")}
                  </button>
                )}
              </div>

              {/* Технические параметры (production) */}
              <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Технические параметры</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Электричество, мин. {powerMin > 0 && `— ${powerMin} кВт`}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={1}
                      value={powerMin}
                      onChange={(e) => updateParam("powerMin", e.target.value)}
                      className="w-full mt-2 accent-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Парковка, мест мин.</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={parkingMin || ""}
                      placeholder="0"
                      onChange={(e) => updateParam("parkingMin", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                    <input
                      type="checkbox"
                      checked={freight}
                      onChange={(e) => updateParam("freight", e.target.checked ? "1" : null)}
                      className="w-4 h-4 rounded border-gray-300 accent-primary"
                    />
                    Грузовой въезд
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                    <input
                      type="checkbox"
                      checked={dock}
                      onChange={(e) => updateParam("dock", e.target.checked ? "1" : null)}
                      className="w-4 h-4 rounded border-gray-300 accent-primary"
                    />
                    Разгрузочная платформа
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                    <input
                      type="checkbox"
                      checked={cyc}
                      onChange={(e) => updateParam("cyc", e.target.checked ? "1" : null)}
                      className="w-4 h-4 rounded border-gray-300 accent-primary"
                    />
                    Белый циклорама
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {filtered.length === 0
                ? t("catalog.notFound")
                : `${t("catalog.found")} ${filtered.length} ${filtered.length === 1 ? t("catalog.location") : t("catalog.locations")}`}
            </p>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-32">
              {filtered.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  highlighted={hoveredId === listing.id}
                  onMouseEnter={() => setHoveredId(listing.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  isFavorite={favorites.has(listing.id)}
                  onToggleFavorite={() => handleToggleFavorite(listing.id)}
                  inCompare={compareSet.has(listing.id)}
                  onToggleCompare={() => handleToggleCompare(listing.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title={t("catalog.emptyTitle")}
              description={t("catalog.emptyDesc")}
              action={{ label: t("catalog.resetFilters"), onClick: clearFilters }}
            />
          )}
        </div>
      </section>

      {/* RIGHT — карта */}
      <aside className="hidden lg:block lg:w-2/5 xl:w-[38%] lg:h-full border-l border-gray-200 bg-white">
        <div className="w-full h-full">
          <Map2GIS listings={filtered} hoveredListingId={hoveredId} />
        </div>
      </aside>

      {/* Mobile floating: Map */}
      <button
        onClick={() => setMobileMapOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold hover:bg-black transition-colors"
        style={compareSet.size > 0 ? { bottom: "6.5rem" } : undefined}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0-8.25l-4.5 1.687v8.25L9 15m0 0 6 2.25m0 0 4.5-1.687V7.313L15 9m0 8.25V9m0 0L9 6.75" />
        </svg>
        Карта
      </button>

      {/* Mobile fullscreen map */}
      {mobileMapOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-semibold text-sm">{filtered.length} локаций на карте</span>
            <button
              onClick={() => setMobileMapOpen(false)}
              className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-semibold"
            >
              Список
            </button>
          </div>
          <div className="flex-1 relative">
            <Map2GIS listings={filtered} hoveredListingId={hoveredId} />
          </div>
        </div>
      )}

      {/* Compare drawer (sticky bottom) */}
      {compareSet.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex gap-2 flex-1 overflow-x-auto">
              {compareListings.map((l) => (
                <div key={l.id} className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 group">
                  {l.images[0] && typeof l.images[0] === 'string' && l.images[0].trim() !== '' ? (
                    <Image src={l.images[0]} alt={l.title} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">Нет фото</div>
                  )}
                  <button
                    onClick={() => handleToggleCompare(l.id)}
                    aria-label={t("catalog.removeCompare")}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              {Array.from({ length: MAX_COMPARE - compareSet.size }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-gray-200" />
              ))}
            </div>
            <button
              onClick={goToCompare}
              disabled={compareSet.size < 2}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              Сравнить ({compareSet.size})
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {compareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl">
          {compareToast}
        </div>
      )}
    </div>
  );
}
