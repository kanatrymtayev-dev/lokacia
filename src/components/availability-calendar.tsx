"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";

interface Props {
  listingId: string;
}

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

const DAYS_MAP: Record<string, string[]> = {
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  kz: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сн", "Жс"],
};
const MONTHS_MAP: Record<string, string[]> = {
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  kz: ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"],
};

function dateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function isInRange(day: string, ranges: DateRange[]) {
  return ranges.some((r) => day >= r.start && day <= r.end);
}

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Monday = 0, Sunday = 6
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: (string | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= lastDay; d++) {
    days.push(dateStr(new Date(year, month, d)));
  }
  return days;
}

export default function AvailabilityCalendar({ listingId }: Props) {
  const { t, lang } = useT();
  const DAYS = DAYS_MAP[lang] || DAYS_MAP.ru;
  const MONTHS = MONTHS_MAP[lang] || MONTHS_MAP.ru;
  const [booked, setBooked] = useState<DateRange[]>([]);
  const [blocked, setBlocked] = useState<DateRange[]>([]);
  const [offset, setOffset] = useState(0); // 0 = current month, 1 = next, etc.

  useEffect(() => {
    async function load() {
      const [bookingsRes, blackoutsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("date")
          .eq("listing_id", listingId)
          .eq("status", "confirmed"),
        supabase
          .from("listing_blackouts")
          .select("start_date, end_date")
          .eq("listing_id", listingId),
      ]);

      if (bookingsRes.data) {
        setBooked(
          (bookingsRes.data as Array<Record<string, unknown>>).map((b) => ({
            start: b.date as string,
            end: b.date as string,
          }))
        );
      }
      if (blackoutsRes.data) {
        setBlocked(
          (blackoutsRes.data as Array<Record<string, unknown>>).map((b) => ({
            start: b.start_date as string,
            end: b.end_date as string,
          }))
        );
      }
    }
    load();
  }, [listingId]);

  const now = new Date();
  const today = dateStr(now);

  const months = [0, 1].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setOffset(Math.max(0, offset - 1))}
          disabled={offset === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => setOffset(offset + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Two months grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {months.map(({ year, month }) => {
          const days = getMonthDays(year, month);
          return (
            <div key={`${year}-${month}`}>
              <div className="text-sm font-semibold text-gray-900 mb-3 text-center">
                {MONTHS[month]} {year}
              </div>
              <div className="grid grid-cols-7 gap-px text-center">
                {DAYS.map((d) => (
                  <div key={d} className="text-[10px] font-medium text-gray-400 pb-2">
                    {d}
                  </div>
                ))}
                {days.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;

                  const isPast = day < today;
                  const isBooked = isInRange(day, booked);
                  const isBlocked = isInRange(day, blocked);
                  const isToday = day === today;

                  let bg = "text-gray-900";
                  let ring = "";
                  if (isPast) bg = "text-gray-300";
                  else if (isBooked) bg = "bg-red-100 text-red-700 font-medium";
                  else if (isBlocked) bg = "bg-gray-100 text-gray-400";

                  if (isToday) ring = "ring-1 ring-primary";

                  return (
                    <div
                      key={day}
                      className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs ${bg} ${ring}`}
                    >
                      {parseInt(day.split("-")[2])}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border border-gray-200" />
          {t("availability.free")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100" />
          {t("availability.booked")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100" />
          {t("availability.blocked")}
        </span>
      </div>
    </div>
  );
}
