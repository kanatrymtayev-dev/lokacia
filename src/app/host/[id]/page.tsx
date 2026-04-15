import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ListingCard from "@/components/listing-card";
import MessageHostButton from "./message-button";
import { getHostProfile, getHostActiveListings } from "@/lib/api";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const host = await getHostProfile(id);
  if (!host) return { title: "Не найдено — LOKACIA.KZ" };
  return {
    title: `${host.name} — Хост на LOKACIA.KZ`,
    description: `Локации от ${host.name} на маркетплейсе LOKACIA.KZ`,
  };
}

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const host = await getHostProfile(id);
  if (!host) notFound();

  const listings = await getHostActiveListings(id);

  const joinedDate = new Date(host.created_at).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  // Агрегируем рейтинг и отзывы по всем локациям хоста
  const totalReviews = listings.reduce((s, l) => s + (l.reviewCount || 0), 0);
  const weightedSum = listings.reduce((s, l) => s + (l.rating || 0) * (l.reviewCount || 0), 0);
  const avgRating = totalReviews > 0 ? weightedSum / totalReviews : 0;
  const responseTime = host.response_time ?? "обычно отвечает в течение нескольких часов";
  const responseRate = host.response_rate ?? null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-4 ring-primary/10">
                {host.avatar_url && typeof host.avatar_url === 'string' && host.avatar_url.trim() !== '' ? (
                  <Image
                    src={host.avatar_url}
                    alt={host.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-bold text-primary">
                      {host.name[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold">{host.name}</h1>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    На платформе с {joinedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                    </svg>
                    {listings.length} {listings.length === 1 ? "локация" : listings.length < 5 ? "локации" : "локаций"}
                  </span>
                </div>

                {/* Message button */}
                <div className="mt-5">
                  <MessageHostButton hostId={id} hostName={host.name} />
                </div>
              </div>
            </div>

            {/* Trust block: rating · reviews · response */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                  </svg>
                  <span className="text-2xl font-bold">{avgRating > 0 ? avgRating.toFixed(2) : "—"}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {totalReviews > 0 ? `${totalReviews} ${totalReviews === 1 ? "отзыв" : totalReviews < 5 ? "отзыва" : "отзывов"}` : "Пока нет отзывов"}
                </div>
              </div>

              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold">{responseRate !== null ? `${responseRate}%` : "—"}</div>
                <div className="mt-1 text-xs text-gray-500">Уровень ответов</div>
              </div>

              <div className="text-center sm:text-left">
                <div className="text-sm font-semibold leading-tight">{responseTime}</div>
                <div className="mt-1 text-xs text-gray-500">Среднее время ответа</div>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div>
            <h2 className="text-xl font-bold mb-6">
              Локации от {host.name}
            </h2>
            {listings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">У этого хоста пока нет активных локаций</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
