"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { getHostListings, getHostBookings, updateBookingStatus, getHostBlackouts, createBlackout, deleteBlackout, createClaim, uploadClaimPhoto, hasOpenClaim, getListingDiscounts, createListingDiscount, deleteListingDiscount } from "@/lib/api";
import type { ListingDiscount } from "@/lib/api";

const AnalyticsTab = dynamic(() => import("./analytics-tab"), {
  ssr: false,
  loading: () => <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>,
});

import VerificationTab from "./verification-tab";
import ProductionModal from "./production-modal";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { Listing, BookingRequest, HostBlackout } from "@/lib/types";
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
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [tab, setTab] = useState<"listings" | "bookings" | "calendar" | "availability" | "discounts" | "analytics" | "verification">("bookings");
  const [productionModal, setProductionModal] = useState<Listing | null>(null);

  // Claims
  const [claimModal, setClaimModal] = useState<{ bookingId: string; deposit: number } | null>(null);
  const [claimDesc, setClaimDesc] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimFiles, setClaimFiles] = useState<File[]>([]);
  const [claimSending, setClaimSending] = useState(false);
  const [claimSent, setClaimSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [listings, bookingsData] = await Promise.all([
      getHostListings(user.id),
      getHostBookings(user.id),
    ]);
    setMyListings(listings);
    setBookings(bookingsData as Array<Record<string, unknown>>);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleBookingAction(bookingId: string, status: "confirmed" | "rejected") {
    await updateBookingStatus(bookingId, status);
    await loadData();
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
    .reduce((sum, b) => sum + (b.total_price as number), 0);

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
            <button
              onClick={() => setTab("calendar")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Календарь
            </button>
            <button
              onClick={() => setTab("availability")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "availability" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Доступность
            </button>
            <button
              onClick={() => setTab("discounts")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "discounts" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Скидки
            </button>
            <button
              onClick={() => setTab("analytics")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "analytics" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Аналитика
            </button>
            <button
              onClick={() => setTab("verification")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "verification" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Верификация
            </button>
          </div>

          {tab === "discounts" && <DiscountsTab listings={myListings} />}
          {tab === "analytics" && <AnalyticsTab hostId={user.id} />}
          {tab === "verification" && <VerificationTab userId={user.id} userRole={user.role} />}
          {productionModal && (
            <ProductionModal
              listing={productionModal}
              onClose={() => setProductionModal(null)}
              onSaved={() => { setProductionModal(null); loadData(); }}
            />
          )}

          {/* Bookings tab */}
          {tab === "bookings" && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">Пока нет бронирований</p>
                </div>
              ) : (
                bookings.map((booking) => {
                  const bl = booking.listings as Record<string, unknown> | null;
                  const images = (bl?.images as string[]) ?? [];
                  const title = (bl?.title as string) ?? "";
                  const slug = (bl?.slug as string) ?? "";
                  const status = booking.status as BookingRequest["status"];
                  const activityType = (booking.activity_type as string) ?? "production";
                  return (
                    <div
                      key={booking.id as string}
                      className="bg-white rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Listing thumbnail */}
                        {images[0] && typeof images[0] === 'string' && images[0].trim() !== '' && (
                          <Link href={`/listing/${slug}`} className="relative w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={images[0]}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          </Link>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold line-clamp-1">{title}</h3>
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

                            {status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleBookingAction(booking.id as string, "confirmed")}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                                >
                                  Принять
                                </button>
                                <button
                                  onClick={() => handleBookingAction(booking.id as string, "rejected")}
                                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                  Отклонить
                                </button>
                              </div>
                            )}
                            {(status === "confirmed" || status === "completed") && (
                              <div className="flex items-center gap-3">
                                <a
                                  href={`/api/invoice/${booking.id as string}`}
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                  </svg>
                                  Скачать счёт
                                </a>
                                <button
                                  onClick={() => {
                                    const meta = booking.metadata as Record<string, unknown> | null;
                                    setClaimModal({
                                      bookingId: booking.id as string,
                                      deposit: (meta?.security_deposit as number) ?? 0,
                                    });
                                    setClaimSent(false);
                                    setClaimDesc("");
                                    setClaimAmount("");
                                    setClaimFiles([]);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                  </svg>
                                  Претензия
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

          {/* Calendar tab */}
          {tab === "calendar" && <CalendarTab bookings={bookings} />}

          {/* Availability tab — blackouts + iCal */}
          {tab === "availability" && (
            <AvailabilityTab listings={myListings} hostId={user.id} />
          )}

          {/* Listings tab */}
          {tab === "listings" && (
            <div className="space-y-4">
              {myListings.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Хотите сдавать площадку?</h3>
                  <p className="text-gray-500 mb-5 max-w-sm mx-auto">Добавьте свою локацию и начните получать бронирования от арендаторов со всего Казахстана</p>
                  <Link
                    href="/dashboard/new"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Добавить локацию
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
                        {listing.images && listing.images.length > 0 && typeof listing.images[0] === 'string' && listing.images[0].trim() !== '' ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Нет фото</div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/listing/${listing.slug}`} className="font-semibold hover:text-primary transition-colors">
                            {listing.title}
                          </Link>
                          {listing.moderationStatus === "pending_review" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">На модерации</span>
                          )}
                          {listing.moderationStatus === "rejected" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Отклонён</span>
                          )}
                        </div>
                        {listing.moderationStatus === "rejected" && listing.moderationNote && (
                          <p className="text-xs text-red-600 mt-0.5">{listing.moderationNote}</p>
                        )}
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
                        <button
                          onClick={() => setProductionModal(listing)}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          ⚡ Технические параметры
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setClaimModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {claimSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg">Претензия отправлена</h3>
                <p className="text-sm text-gray-500 mt-2">Мы рассмотрим вашу претензию и свяжемся с вами.</p>
                <button onClick={() => setClaimModal(null)} className="mt-4 px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-1">Подать претензию</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Опишите повреждения и приложите фото.
                  {claimModal.deposit > 0 && ` Залог: ${formatPrice(claimModal.deposit)}`}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание повреждений</label>
                    <textarea
                      value={claimDesc}
                      onChange={(e) => setClaimDesc(e.target.value)}
                      placeholder="Что было повреждено?"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Сумма ущерба (₸)</label>
                    <input
                      type="number"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фото повреждений (до 5)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).slice(0, 5);
                        setClaimFiles(files);
                      }}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white"
                    />
                    {claimFiles.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{claimFiles.length} файл(ов) выбрано</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setClaimModal(null)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={async () => {
                      if (!claimDesc.trim() || !claimAmount || !user) return;
                      setClaimSending(true);
                      // Upload photos
                      const photoUrls: string[] = [];
                      for (const file of claimFiles) {
                        const url = await uploadClaimPhoto(user.id, file);
                        if (url) photoUrls.push(url);
                      }
                      await createClaim({
                        bookingId: claimModal.bookingId,
                        hostId: user.id,
                        description: claimDesc.trim(),
                        damageAmount: parseInt(claimAmount, 10),
                        photos: photoUrls,
                      });
                      setClaimSending(false);
                      setClaimSent(true);
                    }}
                    disabled={claimSending || !claimDesc.trim() || !claimAmount}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    {claimSending ? "Отправка..." : "Отправить претензию"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

function DiscountsTab({ listings }: { listings: Listing[] }) {
  const [selectedListingId, setSelectedListingId] = useState(listings[0]?.id ?? "");
  const [discounts, setDiscounts] = useState<ListingDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [percent, setPercent] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDiscounts = useCallback(async () => {
    if (!selectedListingId) return;
    setLoading(true);
    setDiscounts(await getListingDiscounts(selectedListingId));
    setLoading(false);
  }, [selectedListingId]);

  useEffect(() => { loadDiscounts(); }, [loadDiscounts]);

  async function handleCreate() {
    if (!startDate || !endDate) { setError("Выберите даты"); return; }
    if (endDate < startDate) { setError("Дата окончания не может быть раньше начала"); return; }
    setSaving(true);
    setError("");
    const { error: err } = await createListingDiscount(selectedListingId, startDate, endDate, percent);
    if (err) {
      setError("Ошибка создания. Возможно, скидка на эти даты уже существует.");
    } else {
      setShowForm(false);
      setStartDate("");
      setEndDate("");
    }
    setSaving(false);
    await loadDiscounts();
  }

  async function handleDelete(id: string) {
    await deleteListingDiscount(id);
    await loadDiscounts();
  }

  const today = new Date().toISOString().split("T")[0];
  const activeDiscounts = discounts.filter((d) => d.endDate >= today);
  const pastDiscounts = discounts.filter((d) => d.endDate < today);
  const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        Сначала создайте локацию, чтобы управлять скидками.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Listing selector */}
      {listings.length > 1 && (
        <select
          value={selectedListingId}
          onChange={(e) => setSelectedListingId(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Скидки на даты</h3>
          <p className="text-xs text-gray-500 mt-0.5">Установите скидки на непиковые дни чтобы привлечь больше арендаторов</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {showForm ? "Отмена" : "+ Добавить скидку"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата начала</label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата окончания</label>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Скидка</label>
              <select
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                {[10, 15, 20, 25, 30, 40, 50].map((p) => (
                  <option key={p} value={p}>{p}%</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={saving || !startDate || !endDate}
            className="mt-4 px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Создание..." : "Создать скидку"}
          </button>
        </div>
      )}

      {/* Active discounts */}
      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Загрузка...</div>
      ) : activeDiscounts.length === 0 && pastDiscounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Нет активных скидок</p>
          <p className="text-xs text-gray-400 mt-1">Добавьте скидку чтобы привлечь арендаторов в непиковые дни</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeDiscounts.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-lg">
                  −{d.discountPercent}%
                </span>
                <div>
                  <div className="text-sm font-medium">
                    {d.startDate === d.endDate ? fmt(d.startDate) : `${fmt(d.startDate)} — ${fmt(d.endDate)}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Удалить
              </button>
            </div>
          ))}

          {/* Past discounts */}
          {pastDiscounts.length > 0 && (
            <>
              <div className="text-xs text-gray-400 mt-4 mb-2">Прошедшие</div>
              {pastDiscounts.map((d) => (
                <div key={d.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-lg">
                      −{d.discountPercent}%
                    </span>
                    <div className="text-sm text-gray-500">
                      {d.startDate === d.endDate ? fmt(d.startDate) : `${fmt(d.startDate)} — ${fmt(d.endDate)}`}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarTab({ bookings }: { bookings: Array<Record<string, unknown>> }) {
  // Только активные брони, не в прошлом, отсортированы по дате+времени и сгруппированы по дню
  const grouped = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const upcoming = bookings
      .filter((b) => {
        const status = b.status as BookingRequest["status"];
        if (status !== "pending" && status !== "confirmed") return false;
        const date = b.date as string;
        return date >= todayStr;
      })
      .sort((a, b) => {
        const ad = (a.date as string) + (a.start_time as string);
        const bd = (b.date as string) + (b.start_time as string);
        return ad.localeCompare(bd);
      });

    const map = new Map<string, Array<Record<string, unknown>>>();
    for (const b of upcoming) {
      const date = b.date as string;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(b);
    }
    return Array.from(map.entries());
  }, [bookings]);

  if (grouped.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg className="w-14 h-14 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <p className="text-gray-500">На ближайшее время съёмок и мероприятий не запланировано</p>
      </div>
    );
  }

  function formatDayHeader(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const formatted = d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
    if (isToday) return `Сегодня · ${formatted}`;
    if (isTomorrow) return `Завтра · ${formatted}`;
    return formatted;
  }

  return (
    <div className="space-y-8">
      {grouped.map(([date, items]) => (
        <section key={date}>
          <h3 className="text-lg font-bold mb-3 capitalize">{formatDayHeader(date)}</h3>
          <div className="space-y-2">
            {items.map((b) => {
              const bl = b.listings as Record<string, unknown> | null;
              const title = (bl?.title as string) ?? "Локация";
              const slug = (bl?.slug as string) ?? "";
              const status = b.status as BookingRequest["status"];
              const activity = (b.activity_type as string) ?? "";
              return (
                <div
                  key={b.id as string}
                  className={`flex items-stretch gap-3 bg-white rounded-xl border ${
                    status === "confirmed" ? "border-green-200" : "border-amber-200"
                  } p-4`}
                >
                  {/* Цветная вертикальная полоса по статусу */}
                  <div
                    className={`w-1 rounded-full flex-shrink-0 ${
                      status === "confirmed" ? "bg-green-500" : "bg-amber-400"
                    }`}
                  />
                  {/* Время */}
                  <div className="flex flex-col items-center justify-center w-20 flex-shrink-0 border-r border-gray-100 pr-3">
                    <div className="text-base font-bold tabular-nums">
                      {(b.start_time as string).slice(0, 5)}
                    </div>
                    <div className="text-[11px] text-gray-400 tabular-nums">
                      до {(b.end_time as string).slice(0, 5)}
                    </div>
                  </div>
                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/listing/${slug}`}
                        className="font-semibold text-sm hover:text-primary line-clamp-1"
                      >
                        {title}
                      </Link>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span>{b.guest_count as number} гостей</span>
                      {activity && (
                        <>
                          <span>•</span>
                          <span>{ACTIVITY_TYPE_LABELS[activity as keyof typeof ACTIVITY_TYPE_LABELS] ?? activity}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-semibold text-gray-700">{formatPrice(b.total_price as number)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function AvailabilityTab({ listings, hostId }: { listings: Listing[]; hostId: string }) {
  const [blackouts, setBlackouts] = useState<HostBlackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [icalCopied, setIcalCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getHostBlackouts(hostId);
    setBlackouts(data);
    setLoading(false);
  }, [hostId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setBlackouts((prev) => prev.filter((b) => b.id !== id));
    await deleteBlackout(id);
  }

  // Группируем по локации
  const byListing = useMemo(() => {
    const map = new Map<string, HostBlackout[]>();
    for (const b of blackouts) {
      if (!map.has(b.listingId)) map.set(b.listingId, []);
      map.get(b.listingId)!.push(b);
    }
    return map;
  }, [blackouts]);

  const icalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/ical/${hostId}`
    : `https://lokacia.kz/api/ical/${hostId}`;
  const webcalUrl = icalUrl.replace(/^https?:/, "webcal:");

  function copyIcal() {
    navigator.clipboard.writeText(icalUrl);
    setIcalCopied(true);
    setTimeout(() => setIcalCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Calendar subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">Подписаться на календарь</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Все ваши подтверждённые брони и блокировки в Apple/Google Calendar
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={webcalUrl}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black transition-colors"
          >
            Открыть в Apple Calendar
          </a>
          <button
            onClick={copyIcal}
            className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {icalCopied ? "✓ Скопировано" : "Скопировать ссылку"}
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Google Calendar:</strong> «Other calendars» → «From URL» → вставьте{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded">{icalUrl}</code>
        </div>
      </div>

      {/* Blackouts */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Заблокированные даты</h3>
        <button
          onClick={() => setModalOpen(true)}
          disabled={listings.length === 0}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40"
        >
          + Заблокировать даты
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Загрузка...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          У вас пока нет локаций
        </div>
      ) : blackouts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          Нет заблокированных дат. Используйте кнопку выше, чтобы отметить периоды недоступности.
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => {
            const items = byListing.get(l.id) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={l.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <Link href={`/listing/${l.slug}`} className="font-semibold hover:text-primary line-clamp-1 mb-2 block">
                  {l.title}
                </Link>
                <div className="space-y-1.5">
                  {items.map((b) => {
                    const fmt = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <div className="text-sm">
                          <span className="font-medium text-amber-800">
                            {b.startDate === b.endDate ? fmt(b.startDate) : `${fmt(b.startDate)} – ${fmt(b.endDate)}`}
                          </span>
                          {b.reason && <span className="text-xs text-amber-600 ml-2">· {b.reason}</span>}
                        </div>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-xs text-amber-700 hover:text-red-600 hover:underline"
                        >
                          Снять блокировку
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <BlackoutModal
          listings={listings}
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function BlackoutModal({
  listings,
  onClose,
  onCreated,
}: {
  listings: Listing[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId || !startDate || !endDate) {
      setError("Заполните локацию и обе даты");
      return;
    }
    if (endDate < startDate) {
      setError("Дата окончания не может быть раньше начала");
      return;
    }
    setSaving(true);
    setError("");
    const { error: err } = await createBlackout({ listingId, startDate, endDate, reason });
    if (err) {
      setError("Не удалось сохранить. Возможно, миграция БД не применена.");
      setSaving(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!saving) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold pr-8">Заблокировать даты</h3>
        <p className="text-sm text-gray-500 mt-1">Эти дни нельзя будет забронировать</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Локация</label>
            <select
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">С</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">По</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Причина (опционально)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Отпуск, ремонт, частное событие..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Заблокировать"}
          </button>
        </form>
      </div>
    </div>
  );
}
