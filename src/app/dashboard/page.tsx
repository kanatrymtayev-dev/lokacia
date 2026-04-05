"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { listings as allListings } from "@/lib/mock-data";
import { getBookingsByListingIds, updateBookingStatus } from "@/lib/bookings-store";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { BookingRequest } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const STATUS_LABELS: Record<BookingRequest["status"], string> = {
  pending: "Ожидает",
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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [tab, setTab] = useState<"listings" | "bookings">("bookings");

  // Host's listings (in real app, filter by user.id)
  const myListings = user?.role === "host" ? allListings.filter((l) => l.hostId === user.id) : [];
  const myListingIds = myListings.map((l) => l.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (myListingIds.length > 0) {
      setBookings(getBookingsByListingIds(myListingIds));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBookingAction(bookingId: string, status: "confirmed" | "rejected") {
    const updated = updateBookingStatus(bookingId, status);
    setBookings(updated.filter((b) => myListingIds.includes(b.listingId)));
  }

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

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Панель хоста</h1>
              <p className="text-gray-600">Добро пожаловать, {user.name}</p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Добавить локацию
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Мои локации</div>
              <div className="text-2xl font-bold mt-1">{myListings.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Всего бронирований</div>
              <div className="text-2xl font-bold mt-1">{bookings.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Ожидают ответа</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">{pendingCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500">Доход</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{formatPrice(Math.round(totalRevenue * 0.85))}</div>
              <div className="text-xs text-gray-400">после комиссии 15%</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            <button
              onClick={() => setTab("bookings")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "bookings" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Бронирования {pendingCount > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("listings")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "listings" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Мои локации
            </button>
          </div>

          {/* Bookings tab */}
          {tab === "bookings" && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">Пока нет бронирований</p>
                </div>
              ) : (
                bookings.map((booking) => {
                  const listing = allListings.find((l) => l.id === booking.listingId);
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Listing thumbnail */}
                        {listing && (
                          <div className="relative w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={listing.images[0]}
                              alt={listing.title}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold line-clamp-1">{listing?.title}</h3>
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

                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-bold">{formatPrice(booking.totalPrice)}</span>

                            {booking.status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleBookingAction(booking.id, "confirmed")}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                                >
                                  Принять
                                </button>
                                <button
                                  onClick={() => handleBookingAction(booking.id, "rejected")}
                                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                  Отклонить
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Listings tab */}
          {tab === "listings" && (
            <div className="space-y-4">
              {myListings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-500 mb-4">У вас пока нет локаций</p>
                  <Link
                    href="/dashboard/new"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
                  >
                    Добавить первую локацию
                  </Link>
                </div>
              ) : (
                myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href={`/listing/${listing.slug}`} className="relative w-full sm:w-32 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link href={`/listing/${listing.slug}`} className="font-semibold hover:text-primary transition-colors">
                          {listing.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{formatPrice(listing.pricePerHour)}/час</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                            </svg>
                            {listing.rating} ({listing.reviewCount})
                          </span>
                          {listing.instantBook && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M11.3 1.046A1 1 0 0 0 9.514.757l-6 9A1 1 0 0 0 4.348 11.5h3.735l-.73 6.454a1 1 0 0 0 1.786.71l6-9a1 1 0 0 0-.835-1.614H10.57l.73-6.004Z" />
                                </svg>
                                Мгновенное
                              </span>
                            </>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-1">{listing.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
