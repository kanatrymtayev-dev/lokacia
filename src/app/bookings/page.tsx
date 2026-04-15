"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { getRenterBookings } from "@/lib/api";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { BookingRequest } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const STATUS_LABELS: Record<BookingRequest["status"], string> = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  rejected: "Отклонено",
  completed: "Завершено",
  cancelled: "Отменено",
};

const STATUS_COLORS: Record<BookingRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    const data = await getRenterBookings(user.id);
    setBookings(data as Array<Record<string, unknown>>);
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-6">Мои бронирования</h1>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-4">У вас пока нет бронирований</p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
              >
                Найти локацию
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const bl = booking.listings as Record<string, unknown> | null;
                const images = (bl?.images as string[]) ?? [];
                const title = (bl?.title as string) ?? "";
                const slug = (bl?.slug as string) ?? "";
                const status = booking.status as BookingRequest["status"];
                const activityType = (booking.activity_type as string) ?? "production";
                return (
                  <div key={booking.id as string} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {images[0] && (
                        <Link href={`/listing/${slug}`} className="relative w-full sm:w-28 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image src={images[0]} alt={title} fill className="object-cover" sizes="112px" />
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/listing/${slug}`} className="font-semibold hover:text-primary transition-colors">
                              {title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                              <span>{booking.date as string}</span>
                              <span>•</span>
                              <span>{booking.start_time as string} — {booking.end_time as string}</span>
                              <span>•</span>
                              <span>{booking.guest_count as number} чел.</span>
                              <span>•</span>
                              <span>{ACTIVITY_TYPE_LABELS[activityType as keyof typeof ACTIVITY_TYPE_LABELS] ?? activityType}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[status]}`}>
                            {STATUS_LABELS[status]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{booking.description as string}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-bold">{formatPrice(booking.total_price as number)}</span>
                          {(status === "confirmed" || status === "completed") && (
                            <a
                              href={`/api/invoice/${booking.id as string}`}
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                              </svg>
                              Скачать счёт
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
