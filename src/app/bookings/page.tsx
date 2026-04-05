"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { listings as allListings } from "@/lib/mock-data";
import { getBookingsByRenter } from "@/lib/bookings-store";
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
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) setBookings(getBookingsByRenter(user.id));
  }, [user]);

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
                const listing = allListings.find((l) => l.id === booking.listingId);
                return (
                  <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {listing && (
                        <Link href={`/listing/${listing.slug}`} className="relative w-full sm:w-28 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="112px" />
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/listing/${listing?.slug}`} className="font-semibold hover:text-primary transition-colors">
                              {listing?.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                              <span>{booking.date}</span>
                              <span>•</span>
                              <span>{booking.startTime} — {booking.endTime}</span>
                              <span>•</span>
                              <span>{booking.guestCount} чел.</span>
                              <span>•</span>
                              <span>{ACTIVITY_TYPE_LABELS[booking.activityType]}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[booking.status]}`}>
                            {STATUS_LABELS[booking.status]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{booking.description}</p>
                        <div className="mt-3 font-bold">{formatPrice(booking.totalPrice)}</div>
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
