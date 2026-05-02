"use client";

import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useLabels } from "@/lib/use-labels";
import { formatPrice, formatRating } from "@/lib/utils";

import FavoriteButton from "./favorite-button";
import ViewTracker from "./view-tracker";
import Gallery from "./gallery";
import ListingMap from "./listing-map";
import BookingSidebar from "./booking-sidebar";
import AvailabilityCalendar from "@/components/availability-calendar";
import VerifiedBadge, { TrustSection } from "@/components/verified-badge";

interface Review {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  text: string;
  createdAt: string;
}

export default function ListingContent({
  listing,
  reviews,
}: {
  listing: Listing;
  reviews: Review[];
}) {
  const { t, lang } = useT();
  const { spaceTypeLabels, cityLabels, activityTypeLabels } = useLabels();
  const dateLocale = lang === "kz" ? "kk-KZ" : lang === "en" ? "en-US" : "ru-RU";

  // Pick translated content with fallback to original (Russian)
  const title = lang === "en" ? listing.titleEn || listing.title : lang === "kz" ? listing.titleKz || listing.title : listing.title;
  const description = lang === "en" ? listing.descriptionEn || listing.description : lang === "kz" ? listing.descriptionKz || listing.description : listing.description;
  const amenities = lang === "en" && listing.amenitiesEn?.length ? listing.amenitiesEn : lang === "kz" && listing.amenitiesKz?.length ? listing.amenitiesKz : listing.amenities;
  const rules = lang === "en" && listing.rulesEn?.length ? listing.rulesEn : lang === "kz" && listing.rulesKz?.length ? listing.rulesKz : listing.rules;

  return (
    <>
      <ViewTracker listingId={listing.id} hostId={listing.hostId} />
      <main className="flex-1 bg-cream">
        {/* Gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Gallery images={listing.images} title={title} />
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left — Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                  <Link
                    href="/catalog"
                    className="text-primary hover:underline"
                  >
                    {t("listing.breadcrumb.catalog")}
                  </Link>
                  <span>/</span>
                  <span>{spaceTypeLabels[listing.spaceType]}</span>
                  <span>/</span>
                  <span>{cityLabels[listing.city]}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex-1">
                    {title}
                  </h1>
                  <div className="flex-shrink-0 pt-1">
                    <FavoriteButton listingId={listing.id} slug={listing.slug} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                    </svg>
                    {formatRating(listing.rating)} ({listing.reviewCount} {t("listing.reviews")})
                  </span>
                  <span>
                    <svg className="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {cityLabels[listing.city]}, {listing.district}
                  </span>
                  <span>{listing.area}{t("listing.sqm")}</span>
                  <span>{t("listing.upTo")} {listing.capacity} {t("listing.people")}</span>
                  {listing.ceilingHeight && <span>{t("listing.ceiling")} {listing.ceilingHeight}{t("listing.meters")}</span>}
                </div>
                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.activityTypes.map((at) => (
                    <span key={at} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                      {activityTypeLabels[at]}
                    </span>
                  ))}
                  {listing.instantBook && (
                    <span className="bg-accent/10 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0 0 9.514.757l-6 9A1 1 0 0 0 4.348 11.5h3.735l-.73 6.454a1 1 0 0 0 1.786.71l6-9a1 1 0 0 0-.835-1.614H10.57l.73-6.004Z" />
                      </svg>
                      {t("listing.instantBook")}
                    </span>
                  )}
                  {listing.superhost && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {t("listing.superhost")}
                    </span>
                  )}
                </div>
              </div>

              {/* Host */}
              <Link
                href={`/host/${listing.hostId}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all group"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all flex items-center justify-center">
                  {listing.hostAvatar && typeof listing.hostAvatar === 'string' && listing.hostAvatar.trim() !== '' ? (
                    <Image
                      src={listing.hostAvatar}
                      alt={listing.hostName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <span className="text-lg text-gray-400 font-bold">{listing.hostName[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold group-hover:text-primary transition-colors">
                    {listing.hostName}
                    <VerifiedBadge idVerified={listing.hostIdVerified} />
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.superhost ? t("listing.superhost") : t("listing.host")} · {t("listing.memberSince")} {new Date(listing.createdAt).toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>

              {/* Trust & Safety */}
              <TrustSection
                phoneVerified={listing.hostPhoneVerified}
                idVerified={listing.hostIdVerified}
                reviewCount={listing.reviewCount}
                memberSince={listing.hostCreatedAt}
              />

              {/* Location */}
              <div>
                <h2 className="text-xl font-bold mb-3">{t("listing.section.location")}</h2>
                <ListingMap listing={listing} />
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold mb-3">{t("listing.section.description")}</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-bold mb-3">{t("listing.section.amenities")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* What's allowed */}
              <div>
                <h2 className="text-xl font-bold mb-3">{t("listing.section.allows")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: "alcohol", label: t("listing.rule.alcohol") },
                    { key: "loudMusic", label: t("listing.rule.loudMusic") },
                    { key: "pets", label: t("listing.rule.pets") },
                    { key: "smoking", label: t("listing.rule.smoking") },
                    { key: "food", label: t("listing.rule.food") },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {listing.allows[key as keyof typeof listing.allows] ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={listing.allows[key as keyof typeof listing.allows] ? "text-gray-700" : "text-gray-400"}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div>
                <h2 className="text-xl font-bold mb-3">{t("listing.section.rules")}</h2>
                <ul className="space-y-2">
                  {rules.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Availability Calendar */}
              <div>
                <h2 className="text-xl font-bold mb-4">{t("listing.section.availability")}</h2>
                <AvailabilityCalendar listingId={listing.id} />
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    {t("listing.section.reviews")} ({reviews.length})
                  </h2>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {review.authorAvatar && typeof review.authorAvatar === 'string' && review.authorAvatar.trim() !== '' ? (
                              <Image
                                src={review.authorAvatar}
                                alt={review.authorName}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            ) : (
                              <span className="text-xs text-gray-400 font-bold">{review.authorName[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{review.authorName}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString(dateLocale, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                            </svg>
                            <span className="text-sm font-semibold">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing details */}
              <div>
                <h2 className="text-xl font-bold mb-3">{t("listing.section.pricing")}</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("listing.pricing.hourly")}</span>
                    <span className="font-medium">{formatPrice(listing.pricePerHour)}{t("listing.pricing.perHour")}</span>
                  </div>
                  {listing.pricePerDay && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("listing.pricing.daily")}</span>
                      <span className="font-medium">{formatPrice(listing.pricePerDay)}{t("listing.pricing.perDay")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("listing.pricing.minBooking")}</span>
                    <span className="font-medium">{listing.minHours} {t("listing.pricing.hours")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("listing.pricing.overtime")}</span>
                    <span className="font-medium">{t("listing.pricing.overtimeRate")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-500 pt-2 border-t border-gray-100">
                    <span>{t("listing.pricing.serviceFee")}</span>
                    <span>{t("common.free")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Booking sidebar */}
            <div className="lg:col-span-1">
              <BookingSidebar listing={listing} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
