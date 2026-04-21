"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function HeroSearch() {
  const router = useRouter();
  const { t } = useT();
  const [activity, setActivity] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const activities = [
    { value: "", label: t("search.anyEvent") },
    { value: "production", label: t("search.production") },
    { value: "event", label: t("search.event") },
    { value: "meeting", label: t("search.meeting") },
    { value: "leisure", label: t("search.leisure") },
  ];

  const cities = [
    { value: "", label: t("search.allCities") },
    { value: "almaty", label: t("search.almaty") },
    { value: "astana", label: t("search.astana") },
    { value: "shymkent", label: t("search.shymkent") },
    { value: "karaganda", label: t("search.karaganda") },
  ];

  const activityLabel = activities.find((a) => a.value === activity)?.label ?? t("search.anyEvent");
  const cityLabel = cities.find((c) => c.value === city)?.label ?? t("search.allCities");

  function handleSearch() {
    const params = new URLSearchParams();
    if (activity) params.set("activity", activity);
    if (city) params.set("city", city);
    if (date) params.set("date", date);
    const qs = params.toString();
    router.push(qs ? `/catalog?${qs}` : "/catalog");
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/15">
          <div className="flex items-stretch">
            <label className="flex-1 relative cursor-pointer group px-6 py-4 min-w-0">
              <span className="block text-xs text-gray-500 mb-0.5">{t("search.what")}</span>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {activities.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <span className="block text-base font-semibold text-gray-900 truncate">{activityLabel}</span>
            </label>
            <div className="flex items-center"><div className="w-px h-10 bg-gray-200" /></div>
            <label className="flex-1 relative cursor-pointer group px-6 py-4 min-w-0">
              <span className="block text-xs text-gray-500 mb-0.5">{t("search.where")}</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span className="block text-base font-semibold text-gray-900 truncate">{cityLabel}</span>
            </label>
            <div className="flex items-center"><div className="w-px h-10 bg-gray-200" /></div>
            <label className="flex-1 relative cursor-pointer group px-6 py-4 min-w-0">
              <span className="block text-xs text-gray-500 mb-0.5">{t("search.when")}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="block text-base font-semibold text-gray-900 truncate">
                {date ? new Date(date + "T00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : t("search.anytime")}
              </span>
            </label>
            <div className="flex items-center pr-3">
              <button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3.5 flex items-center gap-2 transition-all font-semibold text-sm whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                {t("search.find")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/15 p-4 space-y-3">
          <div>
            <span className="block text-xs text-gray-500 mb-1">{t("search.what")}</span>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full appearance-none bg-gray-50 text-gray-900 text-sm font-semibold rounded-lg px-4 py-3 border border-gray-200 focus:outline-none focus:border-primary"
            >
              {activities.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs text-gray-500 mb-1">{t("search.where")}</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full appearance-none bg-gray-50 text-gray-900 text-sm font-semibold rounded-lg px-4 py-3 border border-gray-200 focus:outline-none focus:border-primary"
            >
              {cities.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="block text-xs text-gray-500 mb-1">{t("search.when")}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 text-sm font-semibold rounded-lg px-4 py-3 border border-gray-200 focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleSearch}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 transition-colors font-semibold text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            {t("search.find")}
          </button>
        </div>
      </div>
    </div>
  );
}
