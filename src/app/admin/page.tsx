"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import {
  isAdmin,
  getAdminStats,
  getPendingPayouts,
  getAllPayouts,
  createPayout,
  completePayout,
  getListings,
  setListingFeatured,
} from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Listing } from "@/lib/types";

type Tab = "overview" | "bookings" | "payouts" | "featured";

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

  const loadData = useCallback(async () => {
    if (!authorized) return;
    const [s, pp, ap] = await Promise.all([
      getAdminStats(),
      getPendingPayouts(),
      getAllPayouts(),
    ]);
    setStats(s);
    setPendingPayouts(pp);
    setAllPayouts(ap);
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

  const referralBookings = stats.bookings.filter((b) => b.referral_code).length;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-2">Админ-панель</h1>
          <p className="text-gray-600 mb-8">Управление платежами и выплатами LOKACIA.KZ</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
              <div className="text-sm text-gray-500">Реферальных</div>
              <div className="text-xl font-bold mt-1">{referralBookings}</div>
              <div className="text-xs text-gray-400">бронирований (3%)</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            {(
              [
                ["overview", "Бронирования"],
                ["payouts", "Выплаты"],
                ["featured", "Топ-листинги"],
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
          )}

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
                <h3 className="text-lg font-bold mb-3">История выплат</h3>
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
        </div>
      </main>
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
