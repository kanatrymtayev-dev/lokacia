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
import EmptyState from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n";

export default function FavoritesPage() {
  const { t } = useT();
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
      <main className="flex-1 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("favorites.title")}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {listings.length > 0
                ? listings.length === 1 ? t("favorites.saved", { n: String(listings.length) }) : t("favorites.savedPlural", { n: String(listings.length) })
                : t("favorites.emptyHint")}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-gray-400 text-sm">Загрузка...</div>
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon="favorites"
              title={t("favorites.emptyTitle")}
              description={t("favorites.emptyDesc")}
              action={{ label: t("favorites.goToCatalog"), href: "/catalog" }}
            />
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
