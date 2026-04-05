"use client";

import { useState, useMemo } from "react";
import type { Listing, City, SpaceType, ActivityType } from "@/lib/types";
import {
  CITY_LABELS,
  SPACE_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/types";
import ListingCard from "@/components/listing-card";

const allCities = Object.entries(CITY_LABELS) as [City, string][];
const allSpaceTypes = Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][];
const allActivityTypes = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][];

export default function CatalogClient({ listings }: { listings: Listing[] }) {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<City | "">("");
  const [spaceType, setSpaceType] = useState<SpaceType | "">("");
  const [activityType, setActivityType] = useState<ActivityType | "">("");
  const [instantOnly, setInstantOnly] = useState(false);
  const [superhostOnly, setSuperhostOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

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
      return true;
    });
  }, [listings, search, city, spaceType, activityType, instantOnly, superhostOnly, maxPrice]);

  const activeFilterCount = [city, spaceType, activityType, instantOnly, superhostOnly, maxPrice > 0].filter(Boolean).length;

  function clearFilters() {
    setCity("");
    setSpaceType("");
    setActivityType("");
    setInstantOnly(false);
    setSuperhostOnly(false);
    setMaxPrice(0);
    setSearch("");
  }

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск: циклорама, лофт, вид на горы..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 hover:border-primary/30 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
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

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as City | "")}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
              >
                <option value="">Все города</option>
                {allCities.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            {/* Space type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип помещения</label>
              <select
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value as SpaceType | "")}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
              >
                <option value="">Все типы</option>
                {allSpaceTypes.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            {/* Activity type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Активность</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType | "")}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
              >
                <option value="">Все</option>
                {allActivityTypes.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            {/* Max price */}
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
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={instantOnly}
                onChange={(e) => setInstantOnly(e.target.checked)}
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
                onChange={(e) => setSuperhostOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
              />
              <span className="text-sm">Суперхосты</span>
            </label>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline ml-auto"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {filtered.length === 0
            ? "Ничего не найдено"
            : `Найдено ${filtered.length} ${filtered.length === 1 ? "локация" : "локаций"}`}
        </p>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-600">Локации не найдены</h3>
          <p className="mt-2 text-gray-500">Попробуйте изменить фильтры или поисковый запрос</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-primary font-medium hover:underline"
          >
            Сбросить все фильтры
          </button>
        </div>
      )}
    </div>
  );
}
