"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ListingCard from "@/components/listing-card";
import { useAuth } from "@/lib/auth-context";
import { getFavoriteListings, removeFavorite } from "@/lib/api";
import type { Listing } from "@/lib/types";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/favorites");
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getFavoriteListings(user.id);
    setListings(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnfavorite(listingId: string) {
    if (!user) return;
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    await removeFavorite(user.id, listingId);
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Избранное</h1>
            <p className="mt-1 text-sm text-gray-600">
              {listings.length > 0
                ? `${listings.length} ${listings.length === 1 ? "сохранённая локация" : "сохранённых локаций"}`
                : "Вы можете сохранять понравившиеся локации, чтобы вернуться к ним позже"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-gray-400 text-sm">Загрузка...</div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700">Сохранённых локаций пока нет</h3>
              <p className="mt-1 text-sm text-gray-500">
                Нажмите на сердечко на любой карточке в каталоге, чтобы сохранить её сюда
              </p>
              <Link
                href="/catalog"
                className="inline-block mt-5 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
              >
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite
                  onToggleFavorite={() => handleUnfavorite(listing.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
