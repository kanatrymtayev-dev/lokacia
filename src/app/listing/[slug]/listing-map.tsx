"use client";

import { useEffect, useState, Component, type ReactNode } from "react";
import type { Listing } from "@/lib/types";
import { CITY_LABELS } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { hasUserConfirmedBookingForListing, hasScoutInviteForListing } from "@/lib/api";
import Map2GIS from "@/components/map-wrapper";

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[300px] w-full rounded-2xl border border-gray-200 flex items-center justify-center bg-gray-50 text-sm text-gray-400">
          Карта временно недоступна
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ListingMap({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setUnlocked(false);
      setChecked(true);
      return;
    }
    // Check if user is the host (always show), has confirmed booking, or has scout invite
    if (user.id === listing.hostId) {
      setUnlocked(true);
      setChecked(true);
      return;
    }
    Promise.all([
      hasUserConfirmedBookingForListing(user.id, listing.id),
      hasScoutInviteForListing(user.id, listing.id),
    ]).then(([hasBooking, hasScout]) => {
      if (!cancelled) {
        setUnlocked(hasBooking || hasScout);
        setChecked(true);
      }
    });
    return () => { cancelled = true; };
  }, [user, listing.id]);

  // Пока проверяем — показываем приватный круг, чтобы не моргать с точным адресом
  const showExact = checked && unlocked;

  return (
    <div>
      {showExact ? (
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100 mb-4">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-green-800">{listing.address}</div>
            <div className="text-xs text-green-700 mt-0.5">
              {CITY_LABELS[listing.city]}, {listing.district}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-amber-800">
              {CITY_LABELS[listing.city]}, {listing.district}
            </div>
            <div className="text-xs text-amber-600 mt-0.5">
              Точный адрес будет доступен после приглашения на скаут. Напишите хосту, чтобы договориться о просмотре.
            </div>
          </div>
        </div>
      )}

      <MapErrorBoundary>
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200">
          <Map2GIS
            listings={[listing]}
            approximateRadius={showExact ? undefined : 500}
          />
        </div>
      </MapErrorBoundary>
    </div>
  );
}
