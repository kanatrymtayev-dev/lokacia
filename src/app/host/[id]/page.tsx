import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ListingCard from "@/components/listing-card";
import MessageHostButton from "./message-button";
import EditHostBio from "./edit-bio";
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

const CITY_LABELS: Record<string, string> = {
  almaty: "Алматы",
  astana: "Астана",
  shymkent: "Шымкент",
  karaganda: "Караганда",
};

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

  // Aggregate ratings
  const totalReviews = listings.reduce((s, l) => s + (l.reviewCount || 0), 0);
  const weightedSum = listings.reduce((s, l) => s + (l.rating || 0) * (l.reviewCount || 0), 0);
  const avgRating = totalReviews > 0 ? weightedSum / totalReviews : 0;
  const responseTime = host.response_time ?? "обычно отвечает в течение нескольких часов";
  const responseRate = host.response_rate ?? null;

  // Cities from listings
  const citySet = new Set(listings.map((l) => l.city));
  const cities = Array.from(citySet).map((c) => CITY_LABELS[c] ?? c).filter(Boolean);

  const hasInstagram = host.instagram && host.instagram.trim() !== "";
  const hasTelegram = host.telegram && host.telegram.trim() !== "";
  const hasSocials = hasInstagram || hasTelegram;

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
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
                  {host.name}
                  {host.id_verified && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full" title="Хост прошёл ID-верификацию">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
                      </svg>
                      Verified
                    </span>
                  )}
                </h1>
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
                  {cities.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {cities.join(", ")}
                    </span>
                  )}
                </div>

                {/* Social links */}
                {hasSocials && (
                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                    {hasInstagram && (
                      <a
                        href={host.instagram!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-pink-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                        </svg>
                        Instagram
                      </a>
                    )}
                    {hasTelegram && (
                      <a
                        href={host.telegram!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 1 0 24 12.056A12.01 12.01 0 0 0 11.944 0Zm5.654 7.304-1.95 9.199c-.146.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.579-4.462c.538-.196 1.006.128.804.925Z" />
                        </svg>
                        Telegram
                      </a>
                    )}
                  </div>
                )}

                {/* Message + Edit buttons */}
                <div className="mt-5 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                  <MessageHostButton hostId={id} hostName={host.name} />
                  <EditHostBio
                    hostId={id}
                    initialBio={host.bio ?? ""}
                    initialInstagram={host.instagram ?? ""}
                    initialTelegram={host.telegram ?? ""}
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            {host.bio && host.bio.trim() !== "" && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">О хосте</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{host.bio}</p>
              </div>
            )}

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
