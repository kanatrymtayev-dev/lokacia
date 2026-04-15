"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addFavorite, removeFavorite, getFavoriteIds } from "@/lib/api";

export default function FavoriteButton({ listingId, slug }: { listingId: string; slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setIsFav(false); return; }
    let cancelled = false;
    getFavoriteIds(user.id).then((s) => {
      if (!cancelled) setIsFav(s.has(listingId));
    });
    return () => { cancelled = true; };
  }, [user, listingId]);

  async function toggle() {
    if (!user) {
      router.push(`/login?next=/listing/${slug}`);
      return;
    }
    const next = !isFav;
    setIsFav(next);
    setSaving(true);
    const { error } = next
      ? await addFavorite(user.id, listingId)
      : await removeFavorite(user.id, listingId);
    setSaving(false);
    if (error) {
      // Откат если на сервере не получилось
      setIsFav(!next);
      alert("Не удалось сохранить. Возможно, миграция базы ещё не применена.");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
        isFav
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600"
      } disabled:opacity-60`}
    >
      <svg
        className="w-4 h-4"
        fill={isFav ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
      {isFav ? "В избранном" : "Сохранить"}
    </button>
  );
}
