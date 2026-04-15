import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { CITY_LABELS, SPACE_TYPE_LABELS } from "@/lib/types";
import { formatPrice, formatRating } from "@/lib/utils";

export default function ListingCard({
  listing,
  onMouseEnter,
  onMouseLeave,
  highlighted = false,
  isFavorite,
  onToggleFavorite,
  inCompare,
  onToggleCompare,
}: {
  listing: Listing;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  highlighted?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  inCompare?: boolean;
  onToggleCompare?: () => void;
}) {
  function handleAction(e: React.MouseEvent, fn?: () => void) {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  }

  return (
    <Link
      href={`/listing/${listing.slug}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group block bg-white rounded-2xl border overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
        highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-gray-200 hover:border-primary/20"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {listing.images && listing.images.length > 0 && typeof listing.images[0] === 'string' && listing.images[0].trim() !== '' ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Нет фото
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {listing.featuredUntil && new Date(listing.featuredUntil).getTime() > Date.now() && (
            <span className="bg-amber-400 text-amber-950 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z"/>
              </svg>
              Топ
            </span>
          )}
          {listing.instantBook && (
            <span className="bg-accent text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0 0 9.514.757l-6 9A1 1 0 0 0 4.348 11.5h3.735l-.73 6.454a1 1 0 0 0 1.786.71l6-9a1 1 0 0 0-.835-1.614H10.57l.73-6.004Z" />
              </svg>
              Мгновенно
            </span>
          )}
          {listing.superhost && (
            <span className="bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              Суперхост
            </span>
          )}
          {listing.hostIdVerified && (
            <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" title="Хост прошёл ID-верификацию">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
              </svg>
              Verified
            </span>
          )}
        </div>
        {/* Favorite */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => handleAction(e, onToggleFavorite)}
            aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? "text-red-500" : "text-gray-700"}`}
              fill={isFavorite ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full">
          {formatPrice(listing.pricePerHour)}/час
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {SPACE_TYPE_LABELS[listing.spaceType]}
          </span>
          <span>
            {CITY_LABELS[listing.city]}, {listing.district}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {listing.description}
        </p>

        {/* Bottom row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              {listing.area}м²
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              до {listing.capacity}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
            </svg>
            <span className="text-sm font-semibold">{formatRating(listing.rating)}</span>
            <span className="text-xs text-gray-400">({listing.reviewCount})</span>
          </div>
        </div>

        {/* Production params (если заполнены) */}
        {(listing.powerKw || listing.parkingCapacity || listing.hasFreightAccess || listing.hasLoadingDock || listing.hasWhiteCyc) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            {listing.powerKw ? <span title="Электричество">⚡ {listing.powerKw} кВт</span> : null}
            {listing.parkingCapacity ? <span title="Парковка">🅿 {listing.parkingCapacity}</span> : null}
            {listing.hasFreightAccess && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Грузовой въезд</span>}
            {listing.hasLoadingDock && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Разгрузка</span>}
            {listing.hasWhiteCyc && <span className="bg-gray-100 px-1.5 py-0.5 rounded">Циклорама</span>}
          </div>
        )}

        {/* Compare toggle */}
        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => handleAction(e, onToggleCompare)}
            className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              inCompare
                ? "border-primary text-primary bg-primary/5"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {inCompare ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18M3 12h18m-9 4.5h9" />
              )}
            </svg>
            {inCompare ? "В сравнении" : "Сравнить"}
          </button>
        )}
      </div>
    </Link>
  );
}
