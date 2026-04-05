"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { addBooking } from "@/lib/bookings-store";

export default function BookingSidebar({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [hours, setHours] = useState(listing.minHours);
  const [guests, setGuests] = useState(1);
  const [activity, setActivity] = useState(listing.activityTypes[0]);
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);

  const total = listing.pricePerHour * hours;
  const serviceFee = Math.round(total * 0.075);
  const grandTotal = total + serviceFee;

  function calculateEndTime(start: string, hrs: number): string {
    const [h, m] = start.split(":").map(Number);
    const endH = (h + hrs) % 24;
    return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    addBooking({
      listingId: listing.id,
      renterId: user.id,
      date,
      startTime,
      endTime: calculateEndTime(startTime, hours),
      guestCount: guests,
      activityType: activity,
      description,
      totalPrice: grandTotal,
      status: listing.instantBook ? "confirmed" : "pending",
    });

    setSent(true);
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

        {/* Submit */}
        {user ? (
          <button
            type="submit"
            className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            {listing.instantBook ? (
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

      <p className="mt-3 text-xs text-gray-400 text-center">
        Оплата через Kaspi Pay после подтверждения хостом
      </p>
    </div>
  );
}
