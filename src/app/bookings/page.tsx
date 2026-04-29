"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PaymentSelector from "@/components/payment-selector";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/i18n";
import { getRenterBookings, cancelBooking } from "@/lib/api";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { BookingRequest } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";

type StatusFilter = "all" | BookingRequest["status"];

const TAB_KEYS: StatusFilter[] = ["all", "pending", "confirmed", "completed", "cancelled", "rejected"];

const STATUS_COLORS: Record<BookingRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [tab, setTab] = useState<StatusFilter>("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState<string | null>(null);
  const [paymentToast, setPaymentToast] = useState<"success" | "failed" | null>(null);

  // Payment result toast from redirect (check URL on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const paid = params.get("paid");
    const openBooking = params.get("open");
    if (payment === "success" || paid) {
      setPaymentToast("success");
      setTimeout(() => setPaymentToast(null), 5000);
      window.history.replaceState({}, "", "/bookings");
    } else if (payment === "failed") {
      setPaymentToast("failed");
      setTimeout(() => setPaymentToast(null), 5000);
      window.history.replaceState({}, "", "/bookings");
    }
    if (openBooking) {
      setPaymentOpen(openBooking);
    }
  }, []);

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

  const filtered = useMemo(() => {
    let list = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);
    list = [...list].sort((a, b) => {
      const da = new Date(a.created_at as string).getTime();
      const db = new Date(b.created_at as string).getTime();
      return sortNewest ? db - da : da - db;
    });
    return list;
  }, [bookings, tab, sortNewest]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookings.length };
    for (const b of bookings) {
      const s = b.status as string;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [bookings]);

  async function handleCancel(bookingId: string) {
    if (!user) return;
    setCancelling(bookingId);
    await cancelBooking(bookingId, user.id);
    setConfirmCancel(null);
    setCancelling(null);
    await loadBookings();
  }

  // (payment handled by PaymentSelector component)

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-cream">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
            <div className="skeleton h-8 w-48" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                <div className="flex gap-4">
                  <div className="skeleton w-20 h-20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Payment toast */}
          {paymentToast === "success" && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
              </svg>
              Оплата прошла успешно!
            </div>
          )}
          {paymentToast === "failed" && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd"/>
              </svg>
              Оплата не прошла. Попробуйте снова.
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t("bookings.title")}</h1>
            <button
              onClick={() => setSortNewest(!sortNewest)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              {sortNewest ? t("bookings.newestFirst") : t("bookings.oldestFirst")}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
            {TAB_KEYS.map((key) => {
              const count = tabCounts[key] ?? 0;
              if (key !== "all" && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    tab === key
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {t(`bookings.${key}`)}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs ${tab === key ? "text-white/70" : "text-gray-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="bookings"
              title={tab === "all" ? t("bookings.noBookings") : t("bookings.noInCategory")}
              description="Найдите идеальное пространство для вашего мероприятия"
              action={{ label: t("bookings.findLocation"), href: "/catalog" }}
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((booking) => {
                const bl = booking.listings as Record<string, unknown> | null;
                const images = (bl?.images as string[]) ?? [];
                const firstImg = images[0];
                const title = (bl?.title as string) ?? "";
                const slug = (bl?.slug as string) ?? "";
                const status = booking.status as BookingRequest["status"];
                const activityType = (booking.activity_type as string) ?? "production";
                const canCancel = status === "pending" || status === "confirmed";
                const bookingId = booking.id as string;

                return (
                  <div key={bookingId} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {firstImg && typeof firstImg === "string" && firstImg.trim() !== "" && (
                        <Link href={`/listing/${slug}`} className="relative w-full sm:w-28 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image src={firstImg} alt={title} fill className="object-cover" sizes="112px" />
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
                              <span>·</span>
                              <span>{booking.start_time as string} — {booking.end_time as string}</span>
                              <span>·</span>
                              <span>{booking.guest_count as number} чел.</span>
                              <span>·</span>
                              <span>{ACTIVITY_TYPE_LABELS[activityType as keyof typeof ACTIVITY_TYPE_LABELS] ?? activityType}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[status]}`}>
                            {t(`bookings.status.${status}`)}
                          </span>
                        </div>
                        {booking.description ? (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{String(booking.description)}</p>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="font-bold">
                            {formatPrice(booking.total_price as number)}
                            {(() => {
                              const meta = booking.metadata as Record<string, unknown> | null;
                              const deposit = (meta?.security_deposit as number) ?? 0;
                              return deposit > 0 ? <span className="text-xs font-normal text-gray-400 ml-1">+ залог {formatPrice(deposit)}</span> : null;
                            })()}
                          </span>
                          <div className="flex items-center gap-3">
                            {(status === "confirmed" || status === "completed") && (
                              <a
                                href={`/api/invoice/${bookingId}`}
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                {t("bookings.downloadInvoice")}
                              </a>
                            )}
                            {status === "confirmed" && booking.payment_status !== "paid" && (
                              <button
                                onClick={() => setPaymentOpen(paymentOpen === bookingId ? null : bookingId)}
                                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                </svg>
                                {t("bookings.pay")}
                              </button>
                            )}
                            {status === "confirmed" && booking.payment_status === "paid" && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                </svg>
                                {t("bookings.paid")}
                              </span>
                            )}
                            {canCancel && confirmCancel !== bookingId && (
                              <button
                                onClick={() => setConfirmCancel(bookingId)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                              >
                                {t("bookings.cancel")}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Cancel confirmation */}
                        {confirmCancel === bookingId && (
                          <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg p-3">
                            <span className="text-sm text-red-700">{t("bookings.cancelConfirm")}</span>
                            <button
                              onClick={() => handleCancel(bookingId)}
                              disabled={cancelling === bookingId}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              {cancelling === bookingId ? t("bookings.cancelling") : t("bookings.cancelYes")}
                            </button>
                            <button
                              onClick={() => setConfirmCancel(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              {t("bookings.cancelNo")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment selector panel */}
                    {paymentOpen === bookingId && status === "confirmed" && booking.payment_status !== "paid" && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <PaymentSelector
                          bookingId={bookingId}
                          totalPrice={booking.total_price as number}
                        />
                      </div>
                    )}
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
