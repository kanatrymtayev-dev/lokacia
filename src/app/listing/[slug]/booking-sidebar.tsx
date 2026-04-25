"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Listing, PricingTier, AddOn } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  createBookingRequest,
  checkAvailability,
  getOrCreateConversation,
  sendMessage,
  getListingBookings,
  getListingBlackouts,
  getDiscountForDate,
} from "@/lib/api";
import type { ListingBlackout } from "@/lib/types";

interface ListingBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed";
}

// "HH:MM" → минуты от 00:00
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Полуоткрытый интервал [aStart, aEnd) пересекается с [bStart, bEnd)
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// Подбор тира: минимальный max_guests, который >= guests. Возвращает null если не нашли.
function pickTier(tiers: PricingTier[] | undefined, guests: number): PricingTier | null {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.max_guests - b.max_guests);
  return sorted.find((t) => guests <= t.max_guests) ?? null;
}

function HostOwnerPanel({ listing }: { listing: Listing }) {
  const modStatus = listing.moderationStatus ?? "approved";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
      <h3 className="font-bold text-lg mb-1">Ваша локация</h3>
      <p className="text-xs text-gray-500 mb-5">Управление листингом</p>

      {/* Moderation status */}
      {modStatus === "pending_review" && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
          На модерации. Ожидайте одобрения.
        </div>
      )}
      {modStatus === "rejected" && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd"/>
            </svg>
            Отклонён модератором
          </div>
          {listing.moderationNote && <p className="mt-1 ml-6">{listing.moderationNote}</p>}
        </div>
      )}

      {/* Quick info */}
      <div className="space-y-3 mb-5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Цена за час</span>
          <span className="font-semibold">{formatPrice(listing.pricePerHour)}</span>
        </div>
        {(listing.securityDeposit ?? 0) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Залог</span>
            <span>{formatPrice(listing.securityDeposit!)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Рейтинг</span>
          <span>{listing.rating > 0 ? `${listing.rating.toFixed(1)} (${listing.reviewCount})` : "Нет отзывов"}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <Link
          href={`/dashboard/edit/${listing.id}`}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Редактировать
        </Link>
        <Link
          href="/dashboard?tab=discounts"
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          Скидки
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/dashboard?tab=availability"
            className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Доступность
          </Link>
          <Link
            href="/dashboard?tab=analytics"
            className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            Аналитика
          </Link>
        </div>
      </div>

      {/* Back to dashboard */}
      <Link
        href="/dashboard"
        className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4"
      >
        ← Панель хоста
      </Link>
    </div>
  );
}

export default function BookingSidebar({ listing }: { listing: Listing }) {
  const { user } = useAuth();

  // If the current user is the host of this listing, show owner panel
  if (user?.id === listing.hostId) {
    return <HostOwnerPanel listing={listing} />;
  }

  const router = useRouter();
  const searchParams = useSearchParams();

  // Кастомная смета от хоста (через query params после accept в чате)
  const quotePrice = Number(searchParams.get("quotePrice")) || 0;
  const quoteHours = Number(searchParams.get("quoteHours")) || 0;
  const hasQuote = quotePrice > 0 && quoteHours > 0;

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState(quoteHours || listing.minHours);
  const [guests, setGuests] = useState(1);
  const [activity, setActivity] = useState(listing.activityTypes[0]);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingBookings, setExistingBookings] = useState<ListingBooking[]>([]);
  const [blackouts, setBlackouts] = useState<ListingBlackout[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [bookingTerms, setBookingTerms] = useState(false);

  // Host discount for selected date
  const [hostDiscount, setHostDiscount] = useState(0);

  // Message host state
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSaving, setMsgSaving] = useState(false);
  const [msgError, setMsgError] = useState("");

  // Подбор тира по числу гостей. Если тиров нет — fallback на listing.pricePerHour
  const tiers = listing.pricingTiers ?? [];
  const addOnsList: AddOn[] = listing.addOns ?? [];
  const selectedTier = useMemo(() => pickTier(tiers, guests), [tiers, guests]);
  // Если есть кастомная смета — она перебивает обычную цену
  const basePricePerHour = hasQuote
    ? Math.round(quotePrice / quoteHours)
    : (selectedTier ? selectedTier.price_per_hour : listing.pricePerHour);

  const baseTotal = basePricePerHour * hours;

  // Калькуляция допов: per_hour * hours, flat — как есть
  const addOnsBreakdown = useMemo(() => {
    return addOnsList
      .filter((a) => selectedAddOns.has(a.id))
      .map((a) => ({
        ...a,
        total: a.charge_type === "per_hour" ? a.price * hours : a.price,
      }));
  }, [addOnsList, selectedAddOns, hours]);

  const addOnsTotal = addOnsBreakdown.reduce((s, a) => s + a.total, 0);

  const subtotal = baseTotal + addOnsTotal;
  const hostDiscountAmount = hostDiscount > 0 ? Math.round(subtotal * hostDiscount / 100) : 0;
  const discountedSubtotal = subtotal - hostDiscountAmount;
  const commissionRate = parseFloat(process.env.NEXT_PUBLIC_COMMISSION_RATE || "0");
  const serviceFee = commissionRate > 0 ? Math.round(discountedSubtotal * commissionRate) : 0;
  const grandTotal = discountedSubtotal + serviceFee;

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function calculateEndTime(start: string, hrs: number): string {
    const [h, m] = start.split(":").map(Number);
    const endH = (h + hrs) % 24;
    return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Подгружаем все активные брони + блокировки локации
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getListingBookings(listing.id),
      getListingBlackouts(listing.id),
    ]).then(([bookings, bl]) => {
      if (cancelled) return;
      setExistingBookings(bookings);
      setBlackouts(bl);
    });
    return () => { cancelled = true; };
  }, [listing.id]);

  // Fetch host discount for selected date
  useEffect(() => {
    if (!date) { setHostDiscount(0); return; }
    getDiscountForDate(listing.id, date).then(setHostDiscount);
  }, [listing.id, date]);

  // Конец смены — могут быть переходы через полночь, но мы их запрещаем (см. валидацию)
  const endTime = calculateEndTime(startTime, hours);

  // Бронирования на выбранную дату
  const bookingsOnDate = useMemo(
    () => existingBookings.filter((b) => b.date === date),
    [existingBookings, date]
  );

  // Полная валидация: возвращает текст ошибки или null
  const validationError = useMemo<string | null>(() => {
    if (guests > listing.capacity) {
      return `Максимальная вместимость локации — ${listing.capacity} гостей.`;
    }
    if (tiers.length > 0 && !selectedTier) {
      return `Для ${guests} гостей нет подходящего тарифа. Свяжитесь с хостом.`;
    }
    if (!date) return null; // дата ещё не выбрана — не показываем ошибку
    // Прошедшая дата
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return "Нельзя забронировать на прошедшую дату.";
    }
    if (hours < listing.minHours) {
      return `Минимальное время бронирования — ${listing.minHours} ч.`;
    }
    const startM = toMinutes(startTime);
    const endM = startM + hours * 60;
    // Запрещаем ночные смены (переход через полночь)
    if (endM > 24 * 60) {
      return "Бронирование не может выходить за пределы суток. Сократите длительность.";
    }
    // Сегодня + время уже прошло
    if (date === today) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (startM <= nowMin) return "Время начала уже прошло. Выберите более позднее время.";
    }
    // Хост заблокировал эту дату
    for (const bl of blackouts) {
      if (date >= bl.startDate && date <= bl.endDate) {
        return `Эта дата заблокирована хостом${bl.reason ? `: ${bl.reason}` : ""}.`;
      }
    }
    // Пересечения с pending/confirmed
    for (const b of bookingsOnDate) {
      const bs = toMinutes(b.start_time);
      const be = toMinutes(b.end_time);
      if (overlaps(startM, endM, bs, be)) {
        return `Это время уже занято другим клиентом (${b.start_time}–${b.end_time}). Выберите другое.`;
      }
    }
    return null;
  }, [date, startTime, hours, bookingsOnDate, blackouts, listing.minHours, listing.capacity, guests, tiers.length, selectedTier]);

  const isBlocked = !!validationError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!user.phone_verified) {
      setError("Подтвердите номер телефона в профиле перед бронированием");
      return;
    }

    if (grandTotal >= 100000 && !user.id_verified) {
      setError("Для бронирований от 100 000 ₸ требуется верификация личности. Пройдите верификацию в профиле.");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    // Двойная проверка на стороне сервера — на случай гонки между двумя клиентами
    const available = await checkAvailability(listing.id, date, startTime, endTime);
    if (!available) {
      setError("Это время только что заняли. Обновите страницу и выберите другой слот.");
      setSaving(false);
      return;
    }

    const { data, error: dbError } = await createBookingRequest({
      listingId: listing.id,
      renterId: user.id,
      hostId: listing.hostId,
      date,
      startTime,
      endTime,
      guestCount: guests,
      activityType: activity,
      description,
      totalPrice: grandTotal,
      metadata: {
        base_price: basePricePerHour,
        selected_tier: selectedTier,
        selected_add_ons: Array.from(selectedAddOns),
        add_ons_snapshot: addOnsBreakdown,
        security_deposit: listing.securityDeposit ?? 0,
        host_discount_percent: hostDiscount,
        host_discount_amount: hostDiscountAmount,
      },
    });

    if (dbError || !data) {
      setError("Ошибка бронирования. Попробуйте снова.");
      setSaving(false);
      return;
    }

    router.push(`/inbox?c=${data.conversationId}`);
  }

  async function handleMessageHost(e: FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }

    setMsgSaving(true);
    setMsgError("");

    const convo = await getOrCreateConversation(listing.id, user.id, listing.hostId);
    if (!convo) {
      setMsgError("Не удалось создать беседу. Попробуйте снова.");
      setMsgSaving(false);
      return;
    }

    const { error: msgErr } = await sendMessage(convo.id, user.id, msgText);
    if (msgErr) {
      setMsgError("Ошибка отправки. Попробуйте снова.");
      setMsgSaving(false);
      return;
    }

    setMsgSaving(false);
    router.push(`/inbox?c=${convo.id}`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
      {hasQuote && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
          <span className="font-semibold">Кастомная смета хоста:</span>{" "}
          {new Intl.NumberFormat("ru-RU").format(quotePrice)} ₸ за {quoteHours} ч
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-2xl font-bold">{formatPrice(basePricePerHour)}</span>
        <span className="text-gray-500">/час</span>
        {tiers.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {selectedTier ? `до ${selectedTier.max_guests} гостей` : "вне тарифной сетки"}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>

        {/* Time & Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Часов</label>
            <input
              type="number"
              required
              min={listing.minHours}
              max={24}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Кол-во гостей</label>
          <input
            type="number"
            required
            min={1}
            max={listing.capacity}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>

        {/* Activity type */}
        {listing.activityTypes.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип активности</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as typeof activity)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
            >
              {listing.activityTypes.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Опишите проект</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Что планируете, сколько человек в команде..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
          />
        </div>

        {/* Add-ons */}
        {addOnsList.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Дополнительные услуги</div>
            <div className="space-y-1.5">
              {addOnsList.map((addon) => {
                const checked = selectedAddOns.has(addon.id);
                const lineTotal = addon.charge_type === "per_hour" ? addon.price * hours : addon.price;
                const suffix = addon.charge_type === "per_hour" ? "/час" : "/смена";
                return (
                  <label
                    key={addon.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddOn(addon.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{addon.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatPrice(addon.price)}{suffix}
                        {checked && addon.charge_type === "per_hour" && (
                          <span className="ml-1 text-primary">→ {formatPrice(lineTotal)}</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {hostDiscount > 0 ? (
                <>
                  <span className="line-through text-gray-400">{formatPrice(basePricePerHour)}</span>
                  {" "}
                  <span className="text-green-600">{formatPrice(Math.round(basePricePerHour * (1 - hostDiscount / 100)))}</span>
                  <span className="text-green-600 text-xs ml-1">−{hostDiscount}%</span>
                </>
              ) : (
                formatPrice(basePricePerHour)
              )} × {hours} ч
            </span>
            <span>{formatPrice(baseTotal)}</span>
          </div>
          {addOnsBreakdown.map((a) => (
            <div key={a.id} className="flex justify-between text-gray-600">
              <span className="truncate pr-2">
                + {a.name}
                {a.charge_type === "per_hour" && <span className="text-gray-400"> × {hours} ч</span>}
              </span>
              <span>{formatPrice(a.total)}</span>
            </div>
          ))}
          {/* Host discount */}
          {hostDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                Скидка хоста −{hostDiscount}%
              </span>
              <span>−{formatPrice(hostDiscountAmount)}</span>
            </div>
          )}

          {serviceFee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Сервисный сбор</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
            <span>Итого</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">0% комиссии · Оплата после подтверждения хоста</p>
          {(listing.securityDeposit ?? 0) > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100 mt-2">
              <div>
                <span className="text-gray-600">Залог</span>
                <p className="text-[10px] text-gray-400 mt-0.5">Возвращается через 48ч</p>
              </div>
              <span className="text-gray-600">{formatPrice(listing.securityDeposit!)}</span>
            </div>
          )}
          <a href="/protection" target="_blank" className="block text-[10px] text-primary hover:underline mt-1">
            Подробнее о программе защиты
          </a>
        </div>

        {/* Заблокированные хостом даты в ближайшие 60 дней */}
        {(() => {
          const today = new Date().toISOString().split("T")[0];
          const cutoff = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
          const upcoming = blackouts.filter((b) => b.endDate >= today && b.startDate <= cutoff);
          if (upcoming.length === 0) return null;
          const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
          return (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              <div className="font-semibold mb-1">Хост заблокировал даты:</div>
              <div className="flex flex-wrap gap-1.5">
                {upcoming.map((b) => (
                  <span key={b.id} className="px-2 py-0.5 rounded bg-white border border-amber-200">
                    {b.startDate === b.endDate ? fmt(b.startDate) : `${fmt(b.startDate)} – ${fmt(b.endDate)}`}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Занятые слоты на выбранную дату — подсказка пользователю */}
        {date && bookingsOnDate.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
            <div className="font-semibold text-gray-700 mb-1">Занято в этот день:</div>
            <div className="flex flex-wrap gap-1.5">
              {bookingsOnDate
                .slice()
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((b) => (
                  <span
                    key={b.id}
                    className="px-2 py-0.5 rounded bg-white border border-gray-200 text-[11px] font-medium"
                  >
                    {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Validation error — мгновенная, при изменении даты/времени */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        {/* Server error (после submit) */}
        {!validationError && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Terms checkbox */}
        {user && (
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={bookingTerms}
              onChange={(e) => setBookingTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            <span className="text-xs text-gray-500">
              Принимаю{" "}
              <a href="/terms" target="_blank" className="text-primary hover:underline">условия аренды</a>
              {" "}площадки
            </span>
          </label>
        )}

        {/* Submit */}
        {user ? (
          <button
            type="submit"
            disabled={saving || isBlocked || !date || !bookingTerms}
            className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            {saving ? "Бронирование..." : listing.instantBook ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0 0 9.514.757l-6 9A1 1 0 0 0 4.348 11.5h3.735l-.73 6.454a1 1 0 0 0 1.786.71l6-9a1 1 0 0 0-.835-1.614H10.57l.73-6.004Z" />
                </svg>
                Забронировать мгновенно
              </>
            ) : (
              "Отправить запрос"
            )}
          </button>
        ) : (
          <Link
            href="/login"
            className="block w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors text-center"
          >
            Войти чтобы забронировать
          </Link>
        )}
      </form>

      {/* Message Host Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            if (!user) { router.push("/login"); return; }
            setMsgOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          Написать хосту
        </button>
        <p className="mt-1.5 text-xs text-gray-400 text-center">
          Задайте вопросы или запросите просмотр
        </p>
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Оплата после подтверждения хостом
      </p>

      {/* Message Host Modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { if (!msgSaving) setMsgOpen(false); }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <button
              type="button"
              onClick={() => setMsgOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold pr-8">Написать хосту</h3>
            <p className="mt-1 text-sm text-gray-500">
              Расскажите {listing.hostName} о вашем проекте или запросите просмотр локации.
            </p>

            <form onSubmit={handleMessageHost} className="mt-5 space-y-4">
              {/* Quick action chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Хочу осмотреть локацию перед бронированием",
                  "Подскажите, можно ли провести у вас...",
                  "Интересует скидка при бронировании на целый день",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setMsgText(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  required
                  rows={4}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Здравствуйте! Мы планируем фотосъёмку на 5 человек и хотели бы узнать..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
                />
              </div>

              {msgError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {msgError}
                </div>
              )}

              <button
                type="submit"
                disabled={msgSaving}
                className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {msgSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Отправка...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                    Отправить сообщение
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
