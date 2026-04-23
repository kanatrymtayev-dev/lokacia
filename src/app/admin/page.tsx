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
  getSiteSettings,
  updateSiteSetting,
} from "@/lib/api";
import type { AdminUser, AdminListing, PromoCode } from "@/lib/api";
import type { SiteSettings } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Listing, HostVerification } from "@/lib/types";

type Tab = "overview" | "bookings" | "payouts" | "featured" | "listings" | "moderation" | "verifications" | "users" | "promos" | "settings";

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
                ["listings", "Листинги"],
                ["moderation", "Модерация"],
                ["verifications", "Верификация"],
                ["users", "Пользователи"],
                ["promos", "Промокоды"],
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
          {tab === "listings" && <ListingsTab />}
          {tab === "moderation" && <ModerationTab />}
          {tab === "verifications" && <VerificationsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "promos" && <PromosTab />}
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
