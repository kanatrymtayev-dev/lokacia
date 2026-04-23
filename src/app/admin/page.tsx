"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import {
  isAdmin,
  getAdminStats,
  getPendingPayouts,
  getAllPayouts,
  createPayout,
  completePayout,
  getListings,
  setListingFeatured,
  getAllPendingVerifications,
  reviewVerification,
  getPendingListings,
  moderateListing,
  getAllUsers,
  suspendUser,
  unsuspendUser,
  getAdminListings,
  adminUpdateListing,
  getAdminPromoCodes,
  createPromoCode,
  togglePromoCode,
  getAdminDisputes,
  resolveDispute,
  getOpenDisputeCount,
  getAdminClaims,
  resolveClaim,
  getMessages,
  getAdminOverviewStats,
  getSiteSettings,
  updateSiteSetting,
} from "@/lib/api";
import type { AdminUser, AdminListing, PromoCode, Dispute, Claim } from "@/lib/api";
import type { SiteSettings } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import type { Listing, HostVerification } from "@/lib/types";

type Tab = "overview" | "bookings" | "payouts" | "featured" | "listings" | "moderation" | "verifications" | "users" | "promos" | "disputes" | "claims" | "settings";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Не оплачено",
  paid: "Оплачено",
  refunded: "Возврат",
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  rejected: "Отклонено",
  completed: "Завершено",
  cancelled: "Отменено",
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  processing: "В обработке",
  completed: "Выплачено",
  failed: "Ошибка",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [bookingChatId, setBookingChatId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    payments: Array<Record<string, unknown>>;
    payouts: Array<Record<string, unknown>>;
    bookings: Array<Record<string, unknown>>;
  }>({ payments: [], payouts: [], bookings: [] });
  const [pendingPayouts, setPendingPayouts] = useState<
    Array<{ hostId: string; amount: number; bookingIds: string[] }>
  >([]);
  const [allPayouts, setAllPayouts] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      isAdmin(user.id).then((ok) => {
        if (!ok) router.push("/");
        else setAuthorized(true);
      });
    }
  }, [user, router]);

  const [overviewStats, setOverviewStats] = useState({ totalUsers: 0, hostCount: 0, renterCount: 0, totalListings: 0, activeListings: 0, pendingListings: 0, totalViews: 0 });

  const loadData = useCallback(async () => {
    if (!authorized) return;
    const [s, pp, ap, os] = await Promise.all([
      getAdminStats(),
      getPendingPayouts(),
      getAllPayouts(),
      getAdminOverviewStats(),
    ]);
    setStats(s);
    setPendingPayouts(pp);
    setAllPayouts(ap);
    setOverviewStats(os);
  }, [authorized]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreatePayout(hostId: string, amount: number, bookingIds: string[]) {
    await createPayout(hostId, amount, bookingIds, "");
    await loadData();
  }

  async function handleCompletePayout(payoutId: string) {
    await completePayout(payoutId);
    await loadData();
  }

  if (authLoading || !user || !authorized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    );
  }

  // Calculate stats
  const totalRevenue = stats.bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + (b.total_price as number), 0);

  const totalCommission = stats.bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => {
      const price = b.total_price as number;
      const rate = (b.commission_rate as number) ?? 0.15;
      const serviceFee = Math.round(price * 0.075);
      const base = price - serviceFee;
      return sum + Math.round(base * rate) + serviceFee;
    }, 0);

  const totalPaidOut = allPayouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount as number), 0);

  const pendingPayoutTotal = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

  const promoHosts = overviewStats.totalUsers > 0
    ? stats.bookings.filter((b) => (b.commission_rate as number) === 0).length
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-2">Админ-панель</h1>
          <p className="text-gray-600 mb-8">Управление платежами и выплатами LOKACIA.KZ</p>

          {/* Stats — row 1: financial */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Общий оборот</div>
              <div className="text-xl font-bold mt-1">{formatPrice(totalRevenue)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Доход платформы</div>
              <div className="text-xl font-bold mt-1 text-green-600">{formatPrice(totalCommission)}</div>
              <div className="text-xs text-gray-400">комиссия + сервисный сбор</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Выплачено хостам</div>
              <div className="text-xl font-bold mt-1">{formatPrice(totalPaidOut)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">К выплате</div>
              <div className="text-xl font-bold mt-1 text-amber-600">{formatPrice(pendingPayoutTotal)}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Промо (0%)</div>
              <div className="text-xl font-bold mt-1">{promoHosts}</div>
              <div className="text-xs text-gray-400">бронирований (промо-период)</div>
            </div>
          </div>

          {/* Stats — row 2: platform */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Пользователи</div>
              <div className="text-xl font-bold mt-1">{overviewStats.totalUsers}</div>
              <div className="text-xs text-gray-400">{overviewStats.hostCount} хостов · {overviewStats.renterCount} арендаторов</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Листинги</div>
              <div className="text-xl font-bold mt-1">{overviewStats.activeListings}</div>
              <div className="text-xs text-gray-400">{overviewStats.totalListings} всего · {overviewStats.pendingListings} на модерации</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Просмотры</div>
              <div className="text-xl font-bold mt-1">{overviewStats.totalViews}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Конверсия</div>
              <div className="text-xl font-bold mt-1">
                {overviewStats.totalViews > 0 ? `${((stats.bookings.length / overviewStats.totalViews) * 100).toFixed(1)}%` : "—"}
              </div>
              <div className="text-xs text-gray-400">просмотры → брони</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            {(
              [
                ["overview", "Бронирования"],
                ["payouts", "Выплаты"],
                ["featured", "Топ-листинги"],
                ["listings", "Листинги"],
                ["moderation", "Модерация"],
                ["verifications", "Верификация"],
                ["users", "Пользователи"],
                ["promos", "Промокоды"],
                ["disputes", "Жалобы"],
                ["claims", "Претензии"],
              ["settings", "Настройки"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bookings tab */}
          {tab === "overview" && (
            <>
            {/* Charts */}
            {(() => {
              // Group bookings by week
              function weekKey(dateStr: string) {
                const d = new Date(dateStr);
                const day = d.getUTCDay();
                const offset = (day + 6) % 7;
                const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset));
                return monday.toISOString().slice(0, 10);
              }
              const weeks = new Map<string, { bookings: number; revenue: number }>();
              for (const b of stats.bookings) {
                const k = weekKey(b.created_at as string);
                const prev = weeks.get(k) ?? { bookings: 0, revenue: 0 };
                prev.bookings++;
                if (b.status === "confirmed" || b.status === "completed") {
                  prev.revenue += (b.total_price as number);
                }
                weeks.set(k, prev);
              }
              const sorted = Array.from(weeks.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
              const maxB = Math.max(...sorted.map(([, v]) => v.bookings), 1);
              const maxR = Math.max(...sorted.map(([, v]) => v.revenue), 1);
              const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

              return sorted.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {/* Bookings chart */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Бронирования по неделям</h3>
                    <div className="flex items-end gap-1.5 h-32">
                      {sorted.map(([week, val]) => (
                        <div key={week} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium text-gray-700">{val.bookings}</span>
                          <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(val.bookings / maxB) * 100}%`, minHeight: val.bookings > 0 ? 4 : 0 }} />
                          <span className="text-[9px] text-gray-400">{fmt(week)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Revenue chart */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Оборот по неделям</h3>
                    <div className="flex items-end gap-1.5 h-32">
                      {sorted.map(([week, val]) => (
                        <div key={week} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium text-gray-700">{val.revenue > 0 ? formatPrice(val.revenue) : ""}</span>
                          <div className="w-full bg-green-500/80 rounded-t" style={{ height: `${(val.revenue / maxR) * 100}%`, minHeight: val.revenue > 0 ? 4 : 0 }} />
                          <span className="text-[9px] text-gray-400">{fmt(week)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Top venues */}
            {(() => {
              const venueMap = new Map<string, { title: string; bookings: number; revenue: number }>();
              for (const b of stats.bookings) {
                const listing = b.listings as Record<string, unknown> | null;
                const title = (listing?.title as string) ?? "—";
                const key = title;
                const prev = venueMap.get(key) ?? { title, bookings: 0, revenue: 0 };
                prev.bookings++;
                if (b.status === "confirmed" || b.status === "completed") {
                  prev.revenue += (b.total_price as number);
                }
                venueMap.set(key, prev);
              }
              const topByBookings = Array.from(venueMap.values()).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
              const topByRevenue = Array.from(venueMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

              return topByBookings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Топ-5 по бронированиям</h3>
                    <div className="space-y-2">
                      {topByBookings.map((v, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate flex-1">{i + 1}. {v.title}</span>
                          <span className="font-semibold ml-2">{v.bookings}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Топ-5 по выручке</h3>
                    <div className="space-y-2">
                      {topByRevenue.map((v, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate flex-1">{i + 1}. {v.title}</span>
                          <span className="font-semibold ml-2">{formatPrice(v.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* CSV export + bookings table */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Все бронирования</h3>
              <button
                onClick={() => {
                  const headers = ["ID", "Локация", "Арендатор", "Дата", "Сумма", "Комиссия", "Статус", "Оплата"];
                  const rows = stats.bookings.map((b) => {
                    const listing = b.listings as Record<string, unknown> | null;
                    const renter = b.profiles as Record<string, unknown> | null;
                    return [
                      b.id as string,
                      (listing?.title as string) ?? "",
                      (renter?.name as string) ?? "",
                      b.date as string,
                      b.total_price as number,
                      `${Math.round(((b.commission_rate as number) ?? 0.15) * 100)}%`,
                      b.status as string,
                      b.payment_status as string,
                    ];
                  });
                  downloadCSV(`lokacia-bookings-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
                }}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Скачать CSV
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Локация</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Арендатор</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Комиссия</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Оплата</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Чат</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.bookings.map((b) => {
                      const listing = b.listings as Record<string, unknown> | null;
                      const renter = b.profiles as Record<string, unknown> | null;
                      const rate = (b.commission_rate as number) ?? 0.15;
                      return (
                        <tr key={b.id as string} className="hover:bg-gray-50">
                          <td className="px-4 py-3 max-w-[200px] truncate">
                            {(listing?.title as string) ?? "—"}
                          </td>
                          <td className="px-4 py-3">{(renter?.name as string) ?? "—"}</td>
                          <td className="px-4 py-3">{b.date as string}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPrice(b.total_price as number)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                rate === 0.03
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {Math.round(rate * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs">
                              {BOOKING_STATUS_LABELS[(b.status as string)] ?? b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                b.payment_status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : b.payment_status === "refunded"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {PAYMENT_STATUS_LABELS[(b.payment_status as string)] ?? "Не оплачено"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(b.conversation_id as string | null) ? (
                              <button
                                onClick={() => setBookingChatId(b.conversation_id as string)}
                                className="text-[11px] text-primary hover:text-primary/80 font-medium"
                              >
                                Открыть
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {stats.bookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          Бронирований пока нет
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {bookingChatId && <ChatModal conversationId={bookingChatId} onClose={() => setBookingChatId(null)} />}
            </>)}

          {/* Payouts tab */}
          {tab === "payouts" && (
            <div className="space-y-6">
              {/* Pending payouts */}
              {pendingPayouts.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3">К выплате</h3>
                  <div className="space-y-3">
                    {pendingPayouts.map((p) => (
                      <div
                        key={p.hostId}
                        className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">Хост: {p.hostId.slice(0, 8)}...</div>
                          <div className="text-sm text-gray-500">
                            {p.bookingIds.length} бронирований
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold">{formatPrice(p.amount)}</span>
                          <button
                            onClick={() => handleCreatePayout(p.hostId, p.amount, p.bookingIds)}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                          >
                            Создать выплату
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All payouts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">История выплат</h3>
                  <button
                    onClick={() => {
                      const headers = ["ID", "Хост", "Сумма", "Статус", "Дата"];
                      const rows = allPayouts.map((p) => {
                        const profile = p.profiles as Record<string, unknown> | null;
                        return [p.id as string, (profile?.name as string) ?? "", p.amount as number, p.status as string, new Date(p.created_at as string).toLocaleDateString("ru-RU")];
                      });
                      downloadCSV(`lokacia-payouts-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    CSV
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Хост</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Телефон</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Бронирований</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allPayouts.map((p) => {
                        const profile = p.profiles as Record<string, unknown> | null;
                        return (
                          <tr key={p.id as string} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{(profile?.name as string) ?? "—"}</td>
                            <td className="px-4 py-3">{(profile?.phone as string) ?? (p.kaspi_phone as string) ?? "—"}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatPrice(p.amount as number)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {(p.booking_ids as string[])?.length ?? 0}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  p.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : p.status === "failed"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {PAYOUT_STATUS_LABELS[(p.status as string)] ?? p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {p.status === "pending" && (
                                <button
                                  onClick={() => handleCompletePayout(p.id as string)}
                                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                                >
                                  Выплачено
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {allPayouts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                            Выплат пока нет
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "featured" && <FeaturedTab />}
          {tab === "listings" && <ListingsTab />}
          {tab === "moderation" && <ModerationTab />}
          {tab === "verifications" && <VerificationsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "promos" && <PromosTab />}
          {tab === "disputes" && <DisputesTab />}
          {tab === "claims" && <ClaimsTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

function ListingsTab() {
  const [items, setItems] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [modFilter, setModFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getAdminListings());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter !== "all" && l.city !== cityFilter) return false;
    if (modFilter !== "all" && l.moderationStatus !== modFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  async function handleApprove(id: string) {
    setBusy(id);
    await adminUpdateListing(id, { moderationStatus: "approved", moderationNote: null });
    setBusy(null);
    await load();
  }

  async function handleReject() {
    if (!rejectModal) return;
    setBusy(rejectModal.id);
    await adminUpdateListing(rejectModal.id, { moderationStatus: "rejected", moderationNote: rejectNote || null });
    setBusy(null);
    setRejectModal(null);
    setRejectNote("");
    await load();
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    setBusy(id);
    await adminUpdateListing(id, { status: currentStatus === "active" ? "inactive" : "active" });
    setBusy(null);
    await load();
  }

  const modBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Одобрен</span>;
      case "pending_review": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">На модерации</span>;
      case "rejected": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Отклонён</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Все города</option>
          <option value="almaty">Алматы</option>
          <option value="astana">Астана</option>
          <option value="shymkent">Шымкент</option>
          <option value="karaganda">Караганда</option>
        </select>
        <select
          value={modFilter}
          onChange={(e) => setModFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Вся модерация</option>
          <option value="approved">Одобрены</option>
          <option value="pending_review">На модерации</option>
          <option value="rejected">Отклонены</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} из {items.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Локация</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Хост</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Город</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Цена/час</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Модерация</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Рейтинг</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">Нет листингов</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className={l.status === "inactive" ? "bg-gray-50/50 opacity-60" : "hover:bg-gray-50"}>
                    {/* Listing */}
                    <td className="px-4 py-3">
                      <Link href={`/listing/${l.slug}`} target="_blank" className="flex items-center gap-3 hover:text-primary transition-colors">
                        {l.image && typeof l.image === "string" && l.image.trim() !== "" ? (
                          <div className="relative w-12 h-9 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image src={l.image} alt={l.title} fill sizes="48px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-9 rounded bg-gray-100 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate max-w-[180px]">{l.title}</span>
                      </Link>
                    </td>
                    {/* Host */}
                    <td className="px-4 py-3">
                      <Link href={`/host/${l.hostId}`} target="_blank" className="text-gray-600 hover:text-primary text-xs">
                        {l.hostName}
                      </Link>
                    </td>
                    {/* City */}
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{l.city}</td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right text-xs">{formatPrice(l.pricePerHour)}</td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        l.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                      }`}>
                        {l.status === "active" ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    {/* Moderation */}
                    <td className="px-4 py-3 text-center">{modBadge(l.moderationStatus)}</td>
                    {/* Rating */}
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {l.rating > 0 ? `${l.rating.toFixed(1)} (${l.reviewCount})` : "—"}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(l.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {l.moderationStatus !== "approved" && (
                          <button
                            onClick={() => handleApprove(l.id)}
                            disabled={busy === l.id}
                            className="text-[11px] text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                          >
                            Одобрить
                          </button>
                        )}
                        {l.moderationStatus !== "rejected" && (
                          <button
                            onClick={() => setRejectModal({ id: l.id, title: l.title })}
                            disabled={busy === l.id}
                            className="text-[11px] text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            Отклонить
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(l.id, l.status)}
                          disabled={busy === l.id}
                          className="text-[11px] text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50"
                        >
                          {l.status === "active" ? "Деактив." : "Активир."}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Отклонить листинг</h3>
            <p className="text-sm text-gray-500 mb-4">
              Листинг «{rejectModal.title}» будет отклонён. Хост увидит причину в своём дашборде.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Причина отклонения (видна хосту)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectNote(""); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={busy === rejectModal.id}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {busy === rejectModal.id ? "..." : "Отклонить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModerationTab() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getPendingListings());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(id: string, status: "approved" | "rejected") {
    setBusy(id);
    await moderateListing(id, status, notes[id]);
    setBusy(null);
    await load();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;
  if (items.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
      Нет листингов на модерации
    </div>
  );

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const id = item.id as string;
        const title = item.title as string;
        const slug = item.slug as string;
        const images = item.images as string[];
        const city = item.city as string;
        const pricePerHour = item.price_per_hour as number;
        const profile = item.profiles as Record<string, unknown> | null;
        const hostName = (profile?.name as string) ?? "Хост";
        const hostEmail = (profile?.email as string | null) ?? null;
        const createdAt = item.created_at as string;
        const firstImage = images?.[0];

        return (
          <div key={id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex gap-4 mb-4">
              {firstImage && typeof firstImage === "string" && firstImage.trim() !== "" ? (
                <Link href={`/listing/${slug}`} target="_blank" className="relative w-28 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image src={firstImage} alt={title} fill sizes="112px" className="object-cover" />
                </Link>
              ) : (
                <div className="w-28 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">Нет фото</div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/listing/${slug}`} target="_blank" className="font-semibold hover:text-primary transition-colors">
                  {title}
                </Link>
                <div className="text-sm text-gray-500 mt-0.5">{hostName}{hostEmail && ` · ${hostEmail}`}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{city}</span>
                  <span>•</span>
                  <span>{formatPrice(pricePerHour)}/час</span>
                  <span>•</span>
                  <span>{new Date(createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>
            </div>
            <textarea
              value={notes[id] ?? ""}
              onChange={(e) => setNotes((p) => ({ ...p, [id]: e.target.value }))}
              placeholder="Причина отклонения (опционально, виден хосту)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm resize-none mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => decide(id, "rejected")}
                disabled={busy === id}
                className="flex-1 py-2 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                Отклонить
              </button>
              <button
                onClick={() => decide(id, "approved")}
                disabled={busy === id}
                className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
              >
                Одобрить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerificationsTab() {
  const [items, setItems] = useState<Array<HostVerification & { hostName: string; hostEmail: string | null; hostRole: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getAllPendingVerifications());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function decide(id: string, status: "verified" | "rejected") {
    setBusy(id);
    await reviewVerification(id, status, notes[id]);
    setBusy(null);
    await load();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;
  if (items.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
      Нет заявок на проверку
    </div>
  );

  return (
    <div className="space-y-4">
      {items.map((v) => (
        <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="font-semibold">{v.hostName}</div>
              {v.hostEmail && <div className="text-xs text-gray-500">{v.hostEmail}</div>}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  v.hostRole === "host" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {v.hostRole === "host" ? "Хост" : "Арендатор"}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  v.entityType === "company" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {v.entityType === "company" ? "Юрлицо" : "Физлицо"}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Подано: {new Date(v.submittedAt).toLocaleString("ru-RU")}</div>
            </div>
          </div>

          {/* IIN / BIN info for cross-checking with document */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
            {v.entityType === "individual" && v.iin && (
              <div><span className="text-gray-500">ИИН:</span> <span className="font-mono font-semibold">{v.iin}</span></div>
            )}
            {v.entityType === "company" && (
              <>
                {v.companyName && <div><span className="text-gray-500">Компания:</span> <span className="font-semibold">{v.companyName}</span></div>}
                {v.companyBin && <div><span className="text-gray-500">БИН:</span> <span className="font-mono font-semibold">{v.companyBin}</span></div>}
              </>
            )}
          </div>

          <div className={`grid gap-3 mb-4 ${v.entityType === "company" && v.companyDocUrl ? "grid-cols-3" : "grid-cols-2"}`}>
            {v.idDocUrl && typeof v.idDocUrl === 'string' && v.idDocUrl.trim() !== '' ? (
              <a href={v.idDocUrl} target="_blank" rel="noopener" className="block relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <Image src={v.idDocUrl} alt="Удостоверение" fill sizes="240px" className="object-cover" unoptimized />
                <div className="absolute bottom-1 left-1 text-[10px] bg-white/90 px-1.5 py-0.5 rounded">Удостоверение</div>
              </a>
            ) : (
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">Нет фото</div>
            )}
            {v.selfieUrl && typeof v.selfieUrl === 'string' && v.selfieUrl.trim() !== '' ? (
              <a href={v.selfieUrl} target="_blank" rel="noopener" className="block relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <Image src={v.selfieUrl} alt="Селфи" fill sizes="240px" className="object-cover" unoptimized />
                <div className="absolute bottom-1 left-1 text-[10px] bg-white/90 px-1.5 py-0.5 rounded">Селфи</div>
              </a>
            ) : (
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">Нет фото</div>
            )}
            {v.entityType === "company" && v.companyDocUrl && typeof v.companyDocUrl === 'string' && v.companyDocUrl.trim() !== '' && (
              <a href={v.companyDocUrl} target="_blank" rel="noopener" className="block relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <Image src={v.companyDocUrl} alt="Свидетельство" fill sizes="240px" className="object-cover" unoptimized />
                <div className="absolute bottom-1 left-1 text-[10px] bg-white/90 px-1.5 py-0.5 rounded">Свидетельство</div>
              </a>
            )}
          </div>
          <textarea
            value={notes[v.id] ?? ""}
            onChange={(e) => setNotes((p) => ({ ...p, [v.id]: e.target.value }))}
            placeholder="Комментарий (опционально, виден пользователю при отклонении)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={() => decide(v.id, "rejected")}
              disabled={busy === v.id}
              className="flex-1 py-2 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              Отклонить
            </button>
            <button
              onClick={() => decide(v.id, "verified")}
              disabled={busy === v.id}
              className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
            >
              Подтвердить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedTab() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getListings();
    setListings(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function promote(id: string) {
    setBusy(id);
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await setListingFeatured(id, until);
    await load();
    setBusy(null);
  }

  async function unfeature(id: string) {
    setBusy(id);
    await setListingFeatured(id, null);
    await load();
    setBusy(null);
  }

  const now = Date.now();

  if (loading) {
    return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
        Продвижение поднимает локацию вверх каталога и даёт бейдж «★ Топ» на 7 дней.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-3">Локация</th>
              <th className="text-left px-4 py-3">Город</th>
              <th className="text-left px-4 py-3">Featured до</th>
              <th className="text-right px-4 py-3">Действие</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const active = l.featuredUntil && new Date(l.featuredUntil).getTime() > now;
              return (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <Link href={`/listing/${l.slug}`} className="font-medium text-gray-900 hover:text-primary line-clamp-1">
                      {l.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.city}, {l.district}</td>
                  <td className="px-4 py-3">
                    {active && l.featuredUntil ? (
                      <span className="text-amber-700 font-medium">
                        {new Date(l.featuredUntil).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {active ? (
                      <button
                        onClick={() => unfeature(l.id)}
                        disabled={busy === l.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
                        Снять
                      </button>
                    ) : (
                      <button
                        onClick={() => promote(l.id)}
                        disabled={busy === l.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
                      >
                        Продвинуть на 7 дней
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Локаций нет</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SETTINGS_FIELDS: { key: string; label: string; type: "text" | "textarea" }[] = [
  { key: "site_name", label: "Название сайта", type: "text" },
  { key: "site_tagline", label: "Описание / слоган", type: "textarea" },
  { key: "email", label: "Email", type: "text" },
  { key: "phone", label: "Телефон", type: "text" },
  { key: "address", label: "Адрес", type: "text" },
  { key: "instagram", label: "Instagram (ссылка)", type: "text" },
  { key: "telegram", label: "Telegram (ссылка)", type: "text" },
  { key: "whatsapp", label: "WhatsApp (ссылка или номер)", type: "text" },
];

function ChatModal({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMessages(conversationId).then((m) => { setMsgs(m); setLoading(false); });
  }, [conversationId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold">Переписка</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 text-sm py-8">Загрузка...</div>
          ) : msgs.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">Нет сообщений</div>
          ) : (
            msgs.map((msg) => {
              const isSystem = msg.type === "system" || msg.type === "quote";
              return (
                <div key={msg.id as string} className={isSystem ? "text-center" : ""}>
                  {isSystem ? (
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{msg.content as string}</span>
                  ) : (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-gray-400">{(msg.sender_id as string).slice(0, 8)}</span>
                        <span className="text-[10px] text-gray-400">{new Date(msg.created_at as string).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm text-gray-700">{msg.content as string}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ClaimsTab() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState<Claim | null>(null);
  const [resolution, setResolution] = useState("");
  const [depositHeld, setDepositHeld] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string[] | null>(null);
  const [chatConvoId, setChatConvoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setClaims(await getAdminClaims());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleResolve(status: "approved" | "rejected") {
    if (!resolveModal) return;
    setBusy(true);
    await resolveClaim(
      resolveModal.id,
      status,
      resolution,
      depositHeld,
      parseInt(fundAmount || "0", 10)
    );
    setBusy(false);
    setResolveModal(null);
    setResolution("");
    setDepositHeld(false);
    setFundAmount("");
    await load();
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "open": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Открыта</span>;
      case "approved": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Одобрена</span>;
      case "rejected": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">Отклонена</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;
  if (claims.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
      Нет претензий
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Локация</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Хост</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ущерб</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Залог</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Фото</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td className="px-4 py-3 text-xs">{c.listingTitle}</td>
                  <td className="px-4 py-3 text-xs">{c.hostName}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold">{formatPrice(c.damageAmount)}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{c.securityDeposit > 0 ? formatPrice(c.securityDeposit) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {c.photos.length > 0 ? (
                      <button
                        onClick={() => setPhotoPreview(c.photos)}
                        className="text-[11px] text-primary hover:text-primary/80 font-medium"
                      >
                        {c.photos.length} фото
                      </button>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {c.conversationId && (
                        <button onClick={() => setChatConvoId(c.conversationId)} className="text-[11px] text-primary hover:text-primary/80 font-medium">
                          Чат
                        </button>
                      )}
                      {c.status === "open" && (
                        <button
                          onClick={() => { setResolveModal(c); setResolution(""); setDepositHeld(false); setFundAmount(""); }}
                          className="text-[11px] text-green-600 hover:text-green-800 font-medium"
                        >
                          Решить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo preview */}
      {photoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setPhotoPreview(null)}>
          <div className="max-w-2xl mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {photoPreview.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener">
                <Image src={url} alt={`Фото ${i + 1}`} width={600} height={400} className="rounded-lg object-contain bg-white" unoptimized />
              </a>
            ))}
            <button onClick={() => setPhotoPreview(null)} className="w-full py-2 bg-white rounded-lg text-sm font-medium">Закрыть</button>
          </div>
        </div>
      )}

      {/* Chat modal */}
      {chatConvoId && <ChatModal conversationId={chatConvoId} onClose={() => setChatConvoId(null)} />}

      {/* Resolve modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResolveModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Решить претензию</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <div><span className="text-gray-500">Ущерб:</span> <span className="font-semibold">{formatPrice(resolveModal.damageAmount)}</span></div>
              {resolveModal.securityDeposit > 0 && <div><span className="text-gray-500">Залог:</span> {formatPrice(resolveModal.securityDeposit)}</div>}
              <div><span className="text-gray-500">Описание:</span> {resolveModal.description}</div>
            </div>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={depositHeld} onChange={(e) => setDepositHeld(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm">Удержать залог ({resolveModal.securityDeposit > 0 ? formatPrice(resolveModal.securityDeposit) : "нет залога"})</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Выплата из гарантийного фонда (₸)</label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Решение</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Описание решения..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleResolve("rejected")}
                disabled={busy}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Отклонить
              </button>
              <button
                onClick={() => handleResolve("approved")}
                disabled={busy || !resolution.trim()}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {busy ? "..." : "Одобрить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisputesTab() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState<Dispute | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatConvoId, setChatConvoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDisputes(await getAdminDisputes());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleResolve() {
    if (!resolveModal) return;
    setBusy(true);
    await resolveDispute(resolveModal.id, resolveNote);
    setBusy(false);
    setResolveModal(null);
    setResolveNote("");
    await load();
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "open": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Открыта</span>;
      case "in_progress": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">В работе</span>;
      case "resolved": return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Решена</span>;
      default: return null;
    }
  };

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;
  if (disputes.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
      Нет жалоб
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Локация</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Кто подал</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Причина</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disputes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString("ru-RU")}</td>
                  <td className="px-4 py-3 text-xs">{d.listingTitle}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{d.reporterName}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      d.reporterRole === "host" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {d.reporterRole === "host" ? "Хост" : "Арендатор"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 max-w-[200px] truncate">{d.reason}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(d.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {d.conversationId && (
                        <button
                          onClick={() => setChatConvoId(d.conversationId)}
                          className="text-[11px] text-primary hover:text-primary/80 font-medium"
                        >
                          Чат
                        </button>
                      )}
                      {d.status !== "resolved" && (
                        <button
                          onClick={() => { setResolveModal(d); setResolveNote(""); }}
                          className="text-[11px] text-green-600 hover:text-green-800 font-medium"
                        >
                          Решено
                        </button>
                      )}
                      {d.status === "resolved" && d.adminNote && (
                        <span className="text-[10px] text-gray-400" title={d.adminNote}>Решение</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat modal */}
      {chatConvoId && <ChatModal conversationId={chatConvoId} onClose={() => setChatConvoId(null)} />}

      {/* Resolve modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResolveModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Решить жалобу</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="text-gray-500 mb-1">Причина:</div>
              <div className="text-gray-800">{resolveModal.reason}</div>
            </div>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Какое решение было принято?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Отмена
              </button>
              <button
                onClick={handleResolve}
                disabled={busy || !resolveNote.trim()}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {busy ? "..." : "Решено"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromosTab() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Create form
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"percent" | "fixed">("percent");
  const [newValue, setNewValue] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newValidFrom, setNewValidFrom] = useState("");
  const [newValidUntil, setNewValidUntil] = useState("");
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setPromos(await getAdminPromoCodes());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!newCode.trim() || !newValue) {
      setCreateError("Укажите код и значение скидки");
      return;
    }
    setBusy("create");
    setCreateError("");
    const { error } = await createPromoCode({
      code: newCode.trim(),
      discountType: newType,
      discountValue: parseInt(newValue, 10),
      maxUses: newMaxUses ? parseInt(newMaxUses, 10) : null,
      validFrom: newValidFrom || null,
      validUntil: newValidUntil || null,
    });
    if (error) {
      setCreateError(error.message ?? "Ошибка создания");
    } else {
      setShowCreate(false);
      setNewCode("");
      setNewValue("");
      setNewMaxUses("");
      setNewValidFrom("");
      setNewValidUntil("");
    }
    setBusy(null);
    await load();
  }

  async function handleToggle(id: string, active: boolean) {
    setBusy(id);
    await togglePromoCode(id, !active);
    setBusy(null);
    await load();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-500">{promos.length} промокодов</span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {showCreate ? "Отмена" : "+ Создать промокод"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h3 className="font-bold mb-4">Новый промокод</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Код</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="FIRST50"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Тип скидки</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "percent" | "fixed")}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="percent">Процент (%)</option>
                <option value="fixed">Фиксированная (тг)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Значение ({newType === "percent" ? "%" : "тг"})
              </label>
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newType === "percent" ? "50" : "5000"}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Лимит использований</label>
              <input
                type="number"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                placeholder="Безлимит"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Действует с</label>
              <input
                type="date"
                value={newValidFrom}
                onChange={(e) => setNewValidFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Действует до</label>
              <input
                type="date"
                value={newValidUntil}
                onChange={(e) => setNewValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>
          {createError && <p className="text-xs text-red-600 mt-3">{createError}</p>}
          <button
            onClick={handleCreate}
            disabled={busy === "create"}
            className="mt-4 px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {busy === "create" ? "Создание..." : "Создать"}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Код</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Скидка</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Использований</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Период</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Нет промокодов</td>
                </tr>
              ) : (
                promos.map((p) => {
                  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—";
                  return (
                    <tr key={p.id} className={!p.active ? "opacity-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-3 font-mono font-bold">{p.code}</td>
                      <td className="px-4 py-3 text-center">
                        {p.discountType === "percent"
                          ? `${p.discountValue}%`
                          : formatPrice(p.discountValue)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ""}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {fmt(p.validFrom)} — {fmt(p.validUntil)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                        }`}>
                          {p.active ? "Активен" : "Выключен"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(p.id, p.active)}
                          disabled={busy === p.id}
                          className={`text-xs font-medium disabled:opacity-50 ${
                            p.active ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {p.active ? "Выключить" : "Включить"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "host" | "renter">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [suspendModal, setSuspendModal] = useState<{ userId: string; name: string; action: "suspend" | "unsuspend" } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setUsers(await getAllUsers());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    // Search
    if (search) {
      const q = search.toLowerCase();
      const match = (u.name ?? "").toLowerCase().includes(q)
        || (u.email ?? "").toLowerCase().includes(q)
        || (u.phone ?? "").includes(q);
      if (!match) return false;
    }
    // Role
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    // Verified
    if (verifiedFilter === "verified" && !u.idVerified) return false;
    if (verifiedFilter === "unverified" && u.idVerified) return false;
    return true;
  });

  async function handleSuspendAction() {
    if (!suspendModal) return;
    setBusy(true);
    if (suspendModal.action === "suspend") {
      await suspendUser(suspendModal.userId, suspendReason);
    } else {
      await unsuspendUser(suspendModal.userId);
    }
    setBusy(false);
    setSuspendModal(null);
    setSuspendReason("");
    await load();
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, email, телефону..."
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "host" | "renter")}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Все роли</option>
          <option value="host">Хосты</option>
          <option value="renter">Арендаторы</option>
        </select>
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value as "all" | "verified" | "unverified")}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Все</option>
          <option value="verified">Верифицированы</option>
          <option value="unverified">Не верифицированы</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} из {users.length}</span>
        <button
          onClick={() => {
            const headers = ["ID", "Имя", "Email", "Телефон", "Роль", "Верифицирован", "Листингов", "Бронирований", "Регистрация"];
            const rows = filtered.map((u) => [u.id, u.name, u.email ?? "", u.phone ?? "", u.role, u.idVerified ? "Да" : "Нет", u.listingCount, u.bookingCount, new Date(u.createdAt).toLocaleDateString("ru-RU")]);
            downloadCSV(`lokacia-users-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
          }}
          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Контакт</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Роль</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Верификация</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Листинги</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Брони</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Регистрация</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Нет пользователей</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className={u.suspended ? "bg-red-50/50" : "hover:bg-gray-50"}>
                    {/* User */}
                    <td className="px-4 py-3">
                      <Link
                        href={u.role === "host" ? `/host/${u.id}` : `/guest/${u.id}`}
                        target="_blank"
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {u.avatarUrl && typeof u.avatarUrl === "string" && u.avatarUrl.trim() !== "" ? (
                            <Image src={u.avatarUrl} alt={u.name} fill sizes="32px" className="object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-primary">{u.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          {u.suspended && (
                            <span className="text-[10px] text-red-600 font-medium">Заблокирован</span>
                          )}
                        </div>
                      </Link>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">{u.email ?? "—"}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {u.phone ?? "—"}
                        {u.phoneVerified && (
                          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        u.role === "host" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role === "host" ? "Хост" : "Арендатор"}
                      </span>
                    </td>
                    {/* Verified */}
                    <td className="px-4 py-3 text-center">
                      {u.idVerified ? (
                        <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </td>
                    {/* Listings */}
                    <td className="px-4 py-3 text-center text-gray-600">{u.listingCount}</td>
                    {/* Bookings */}
                    <td className="px-4 py-3 text-center text-gray-600">{u.bookingCount}</td>
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      {u.suspended ? (
                        <button
                          onClick={() => setSuspendModal({ userId: u.id, name: u.name, action: "unsuspend" })}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Разблокировать
                        </button>
                      ) : (
                        <button
                          onClick={() => setSuspendModal({ userId: u.id, name: u.name, action: "suspend" })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Заблокировать
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend/Unsuspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSuspendModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">
              {suspendModal.action === "suspend" ? "Заблокировать пользователя" : "Разблокировать пользователя"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {suspendModal.action === "suspend"
                ? `Вы уверены что хотите заблокировать ${suspendModal.name}? Пользователь не сможет войти, его листинги будут скрыты.`
                : `Разблокировать ${suspendModal.name}? Доступ к платформе будет восстановлен.`}
            </p>
            {suspendModal.action === "suspend" && (
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Причина блокировки (опционально)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none resize-none mb-4"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setSuspendModal(null); setSuspendReason(""); }}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSuspendAction}
                disabled={busy}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-50 ${
                  suspendModal.action === "suspend"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {busy ? "..." : suspendModal.action === "suspend" ? "Заблокировать" : "Разблокировать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [draft, setDraft] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getSiteSettings();
    setSettings(data);
    setDraft(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleChange(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const hasChanges = SETTINGS_FIELDS.some((f) => (draft[f.key] ?? "") !== (settings[f.key] ?? ""));

  async function handleSave() {
    setSaving(true);
    const changed = SETTINGS_FIELDS.filter((f) => (draft[f.key] ?? "") !== (settings[f.key] ?? ""));
    for (const f of changed) {
      await updateSiteSetting(f.key, draft[f.key] ?? "");
    }
    setSettings({ ...draft });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Настройки сайта</h3>
        <p className="text-sm text-gray-500 mt-1">
          Эти данные отображаются в footer, на страницах «О нас», «Контакты» и в email-уведомлениях.
        </p>
      </div>

      <div className="space-y-5 max-w-xl">
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={draft[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            ) : (
              <input
                type="text"
                value={draft[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Сохранено!</span>
        )}
        {hasChanges && !saved && (
          <span className="text-sm text-amber-600">Есть несохранённые изменения</span>
        )}
      </div>
    </div>
  );
}
