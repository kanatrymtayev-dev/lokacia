"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { trackListingView } from "@/lib/api";

export default function ViewTracker({ listingId, hostId }: { listingId: string; hostId: string }) {
  const { user, loading } = useAuth();
  const fired = useRef(false);

  useEffect(() => {
    if (loading || fired.current) return;
    // Не считаем просмотр самого хоста на своей же локации
    if (user?.id === hostId) {
      fired.current = true;
      return;
    }
    fired.current = true;
    void trackListingView(listingId, user?.id ?? null);
  }, [loading, user, listingId, hostId]);

  return null;
}
