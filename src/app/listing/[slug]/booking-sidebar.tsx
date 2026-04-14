"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { createBooking, checkAvailability, getOrCreateConversation, sendMessage } from "@/lib/api";

export default function BookingSidebar({ listing, referralCode }: { listing: Listing; referralCode?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState(listing.minHours);
  const [guests, setGuests] = useState(1);
  const [activity, setActivity] = useState(listing.activityTypes[0]);
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Message host state
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSaving, setMsgSaving] = useState(false);
  const [msgError, setMsgError] = useState("");

  const total = listing.pricePerHour * hours;
  const serviceFee = Math.round(total * 0.075);
  const grandTotal = total + serviceFee;

  function calculateEndTime(start: string, hrs: number): string {
    const [h, m] = start.split(":").map(Number);
    const endH = (h + hrs) % 24;
    return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");

    const endTime = calculateEndTime(startTime, hours);

    const available = await checkAvailability(listing.id, date, startTime, endTime);
    if (!available) {
      setError("Это время уже занято. Выберите другое время.");
      setSaving(false);
      return;
    }

    const { error: dbError } = await createBooking({
      listingId: listing.id,
      renterId: user.id,
      date,
      startTime,
      endTime,
      guestCount: guests,
      activityType: activity,
      description,
      totalPrice: grandTotal,
      status: listing.instantBook ? "confirmed" : "pending",
      referralCode,
    });

    if (dbError) {
      setError("Ошибка бронирования. Попробуйте снова.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSent(true);
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

  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center sticky top-24">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-3 text-lg font-bold">
          {listing.instantBook ? "Забронировано!" : "Запрос отправлен!"}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {listing.instantBook
            ? "Бронирование подтверждено. Оплата через Kaspi Pay."
            : `${listing.hostName} получит ваш запрос и ответит в течение 12 часов.`}
        </p>
        <Link
          href="/bookings"
          className="inline-block mt-4 text-primary text-sm font-medium hover:underline"
        >
          Посмотреть мои бронирования
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
      {/* Price */}
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-2xl font-bold">{formatPrice(listing.pricePerHour)}</span>
        <span className="text-gray-500">/час</span>
        {listing.pricePerDay && (
          <span className="text-sm text-gray-400 ml-auto">
            или {formatPrice(listing.pricePerDay)}/день
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

        {/* Price breakdown */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {formatPrice(listing.pricePerHour)} × {hours} ч
            </span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Сервисный сбор</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
            <span>Итого</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        {user ? (
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {referralCode && (
        <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs text-center">
          Реферальное бронирование — комиссия хоста 3%
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400 text-center">
        Оплата через Kaspi Pay после подтверждения хостом
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
