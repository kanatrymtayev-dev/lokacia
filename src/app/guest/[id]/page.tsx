import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getProfile, getReviewsAboutGuest } from "@/lib/api";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return { title: "Не найдено — LOKACIA.KZ" };
  return {
    title: `${profile.name} — Гость на LOKACIA.KZ`,
    description: `Профиль гостя ${profile.name} на маркетплейсе LOKACIA.KZ`,
  };
}

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  const name = (profile.name as string) ?? "Пользователь";
  const avatarUrl = profile.avatar_url as string | null;
  const idVerified = (profile.id_verified as boolean) ?? false;
  const createdAt = profile.created_at as string | undefined;

  const reviews = await getReviewsAboutGuest(id);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.rating as number), 0) / totalReviews
      : 0;

  const joinedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-4 ring-primary/10">
                {avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim() !== "" ? (
                  <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-bold text-primary">
                      {name[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
                  {name}
                  {idVerified && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full" title="Пользователь прошёл ID-верификацию">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500">
                  {joinedDate && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      На LOKACIA с {joinedDate}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    {totalReviews > 0
                      ? `${totalReviews} ${totalReviews === 1 ? "отзыв" : totalReviews < 5 ? "отзыва" : "отзывов"} от хостов`
                      : "Пока нет отзывов"}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating summary */}
            {totalReviews > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                  </svg>
                  <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">средний рейтинг от хостов</span>
                </div>
              </div>
            )}
          </div>

          {/* Reviews */}
          <h2 className="text-xl font-bold mb-6">Отзывы хостов о {name}</h2>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Пока нет отзывов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const author = review.profiles as Record<string, unknown> | null;
                const authorName = (author?.name as string) ?? "Хост";
                const authorAvatar = author?.avatar_url as string | null;
                const rating = review.rating as number;
                const text = review.text as string;
                const date = new Date(review.created_at as string).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div key={review.id as string} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                        {authorAvatar && typeof authorAvatar === "string" && authorAvatar.trim() !== "" ? (
                          <Image src={authorAvatar} alt={authorName} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{authorName[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-gray-900">{authorName}</span>
                          <span className="text-xs text-gray-400 shrink-0">{date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400" : "text-gray-200"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                            </svg>
                          ))}
                        </div>
                        {text && (
                          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{text}</p>
                        )}
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
