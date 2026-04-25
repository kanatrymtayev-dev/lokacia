"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getHostAnalytics } from "@/lib/api";
import type { WeekStat } from "@/lib/types";

interface Stats {
  views: WeekStat[];
  bookings: WeekStat[];
  revenue: WeekStat[];
  conversionRate: number;
}

const fmtNum = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
const fmtMoney = (n: number) => fmtNum(Math.round(n)) + " ₸";

function shortWeek(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function AnalyticsTab({ hostId }: { hostId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHostAnalytics(hostId).then((data) => {
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [hostId]);

  if (loading) {
    return <div className="text-gray-400 text-sm py-8 text-center">Загрузка аналитики...</div>;
  }
  if (!stats) {
    return <div className="text-gray-500 text-sm py-8 text-center">Не удалось загрузить аналитику</div>;
  }

  const totalViews = stats.views.reduce((s, w) => s + w.value, 0);
  const totalBookings = stats.bookings.reduce((s, w) => s + w.value, 0);
  const totalRevenueGross = stats.revenue.reduce((s, w) => s + w.value, 0);
  const totalRevenueNet = Math.round(totalRevenueGross * 0.85);

  const lineData = stats.views.map((v, i) => ({
    week: shortWeek(v.weekStart),
    Просмотры: v.value,
    Бронирования: stats.bookings[i]?.value ?? 0,
  }));

  const barData = stats.revenue.map((v) => ({
    week: shortWeek(v.weekStart),
    Доход: v.value,
  }));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Просмотры (8 нед.)" value={fmtNum(totalViews)} />
        <Kpi label="Бронирования" value={fmtNum(totalBookings)} />
        <Kpi label="Конверсия" value={`${stats.conversionRate}%`} accent />
        <Kpi label="Доход (0% комиссии)" value={fmtMoney(totalRevenueNet)} accent />
      </div>

      {/* Views + Bookings line chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Просмотры и бронирования по неделям</h3>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => fmtNum(Number(v ?? 0))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Просмотры" stroke="#6d28d9" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Бронирования" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Доход по неделям</h3>
          <span className="text-xs text-gray-400">учитывает confirmed/completed брони, дата съёмки</span>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => fmtMoney(Number(v ?? 0))}
              />
              <Bar dataKey="Доход" fill="#6d28d9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
