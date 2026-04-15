import { supabase } from "./supabase";
import { listings as mockListings, reviews as mockReviews } from "./mock-data";
import type { Listing, Review } from "./types";
import { geocodeAddress } from "./geocoder";
import {
  sendBookingPendingEmail,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
  sendNewMessageEmail,
} from "./email";

const SITE_URL = "https://lokacia.kz";

// Хелпер: получить email + name пользователя через auth.users + profiles
async function getUserEmailName(userId: string): Promise<{ email: string; name: string } | null> {
  // profiles.email отсутствует — берём из auth.users через admin API недоступно, поэтому
  // хранится rest: email есть только в auth metadata. Используем supabase.auth.admin?
  // У нас anon key — admin недоступен. Решение: добавить email в profiles при регистрации
  // (см. auth-context). Если поля нет — fallback null и письмо не уйдёт.
  const { data } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", userId)
    .single();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const email = (row.email as string | null) ?? null;
  const name = (row.name as string | null) ?? "Пользователь";
  if (!email) return null;
  return { email, name };
}

// Rate-limit: не чаще 1 email на conversation в 5 минут
const messageEmailLastSent = new Map<string, number>();
const MESSAGE_EMAIL_COOLDOWN_MS = 5 * 60 * 1000;

// Helper to convert Supabase row to Listing type
function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    spaceType: row.space_type as Listing["spaceType"],
    activityTypes: row.activity_types as Listing["activityTypes"],
    city: row.city as Listing["city"],
    district: row.district as string,
    address: row.address as string,
    lat: row.lat as number,
    lng: row.lng as number,
    area: row.area as number,
    capacity: row.capacity as number,
    ceilingHeight: row.ceiling_height as number | undefined,
    pricePerHour: row.price_per_hour as number,
    pricePerDay: row.price_per_day as number | undefined,
    minHours: row.min_hours as number,
    images: row.images as string[],
    styles: row.styles as Listing["styles"],
    amenities: row.amenities as string[],
    rules: row.rules as string[],
    allows: {
      alcohol: row.allows_alcohol as boolean,
      loudMusic: row.allows_loud_music as boolean,
      pets: row.allows_pets as boolean,
      smoking: row.allows_smoking as boolean,
      food: row.allows_food as boolean,
    },
    hostId: row.host_id as string,
    hostName: (row as Record<string, unknown>).host_name as string ?? "Хост",
    hostAvatar: (row as Record<string, unknown>).host_avatar as string ?? "",
    hostPhone: (row as Record<string, unknown>).host_phone as string ?? "",
    rating: row.rating as number,
    reviewCount: row.review_count as number,
    instantBook: row.instant_book as boolean,
    superhost: row.superhost as boolean,
    pricingTiers: (row.pricing_tiers as Listing["pricingTiers"]) ?? [],
    addOns: (row.add_ons as Listing["addOns"]) ?? [],
    featuredUntil: (row.featured_until as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    // Fallback to mock data
    return mockListings;
  }

  const all = data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return rowToListing({
      ...row,
      host_name: profile?.name ?? "Хост",
      host_avatar: profile?.avatar_url ?? "",
      host_phone: profile?.phone ?? "",
    });
  });

  // Featured (с активным featured_until) идут первыми, затем остальные
  const now = Date.now();
  const featured = all.filter((l) => l.featuredUntil && new Date(l.featuredUntil).getTime() > now);
  const featuredIds = new Set(featured.map((l) => l.id));
  const rest = all.filter((l) => !featuredIds.has(l.id));
  return [...featured, ...rest];
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    // Fallback to mock data
    const mock = mockListings.find((l) => l.slug === slug);
    return mock ?? null;
  }

  const profile = (data as Record<string, unknown>).profiles as Record<string, unknown> | null;
  return rowToListing({
    ...(data as Record<string, unknown>),
    host_name: profile?.name ?? "Хост",
    host_avatar: profile?.avatar_url ?? "",
    host_phone: profile?.phone ?? "",
  });
}

export async function getReviewsByListingId(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles!reviews_author_id_fkey(name, avatar_url)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return mockReviews.filter((r) => r.listingId === listingId);
  }

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return {
      id: row.id as string,
      listingId: row.listing_id as string,
      authorName: (profile?.name as string) ?? "Пользователь",
      authorAvatar: (profile?.avatar_url as string) ?? "",
      rating: row.rating as number,
      text: row.text as string,
      createdAt: row.created_at as string,
    };
  });
}

// ---- Favorites / Wishlists ----

export async function addFavorite(userId: string, listingId: string) {
  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: userId, listing_id: listingId }, { onConflict: "user_id,listing_id" });
  return { error };
}

export async function removeFavorite(userId: string, listingId: string) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);
  return { error };
}

export async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r: Record<string, unknown>) => r.listing_id as string));
}

export async function getFavoriteListings(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, listings!favorites_listing_id_fkey(*, profiles!listings_host_id_fkey(name, phone, avatar_url))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((r: Record<string, unknown>) => {
      const listing = r.listings as Record<string, unknown> | null;
      if (!listing) return null;
      const profile = listing.profiles as Record<string, unknown> | null;
      return rowToListing({
        ...listing,
        host_name: profile?.name ?? "Хост",
        host_avatar: profile?.avatar_url ?? "",
        host_phone: profile?.phone ?? "",
      });
    })
    .filter((l): l is Listing => l !== null);
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url)")
    .in("id", ids);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return rowToListing({
      ...row,
      host_name: profile?.name ?? "Хост",
      host_avatar: profile?.avatar_url ?? "",
      host_phone: profile?.phone ?? "",
    });
  });
}

// ---- Listing views (analytics tracking) ----

export async function trackListingView(listingId: string, viewerId?: string | null) {
  try {
    await supabase.from("listing_views").insert({
      listing_id: listingId,
      viewer_id: viewerId ?? null,
    });
  } catch {
    // fire-and-forget
  }
}

// ---- Host analytics ----

import type { WeekStat } from "./types";

function startOfWeekUTC(d: Date): Date {
  // Понедельник как начало недели, нормализованный до UTC 00:00
  const day = d.getUTCDay(); // 0..6 (вс=0)
  const offset = (day + 6) % 7; // дней от понедельника
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset));
  return monday;
}

function weeksBack(n: number): string[] {
  const today = startOfWeekUTC(new Date());
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i * 7);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function weekKey(dateISO: string): string {
  return startOfWeekUTC(new Date(dateISO)).toISOString().slice(0, 10);
}

export async function getHostAnalytics(hostId: string): Promise<{
  views: WeekStat[];
  bookings: WeekStat[];
  revenue: WeekStat[];
  conversionRate: number;
}> {
  const buckets = weeksBack(8);
  const sinceISO = buckets[0]; // YYYY-MM-DD начало 8 недели назад

  // 1. Listings хоста (id'шки)
  const { data: listings } = await supabase
    .from("listings")
    .select("id")
    .eq("host_id", hostId);
  const listingIds = (listings ?? []).map((r: Record<string, unknown>) => r.id as string);
  if (listingIds.length === 0) {
    const empty = buckets.map((w) => ({ weekStart: w, value: 0 }));
    return { views: empty, bookings: empty, revenue: empty, conversionRate: 0 };
  }

  // 2. Параллельно: views, bookings (created_at), bookings (date for revenue)
  const [viewsRes, bookingsRes] = await Promise.all([
    supabase
      .from("listing_views")
      .select("viewed_at, listing_id")
      .in("listing_id", listingIds)
      .gte("viewed_at", sinceISO),
    supabase
      .from("bookings")
      .select("created_at, date, total_price, status, listing_id")
      .in("listing_id", listingIds)
      .gte("created_at", sinceISO),
  ]);

  const viewsByWeek = new Map<string, number>(buckets.map((w) => [w, 0]));
  const bookingsByWeek = new Map<string, number>(buckets.map((w) => [w, 0]));
  const revenueByWeek = new Map<string, number>(buckets.map((w) => [w, 0]));

  for (const v of (viewsRes.data ?? []) as Array<Record<string, unknown>>) {
    const k = weekKey(v.viewed_at as string);
    if (viewsByWeek.has(k)) viewsByWeek.set(k, (viewsByWeek.get(k) ?? 0) + 1);
  }

  let totalBookings = 0;
  for (const b of (bookingsRes.data ?? []) as Array<Record<string, unknown>>) {
    const kCreated = weekKey(b.created_at as string);
    if (bookingsByWeek.has(kCreated)) {
      bookingsByWeek.set(kCreated, (bookingsByWeek.get(kCreated) ?? 0) + 1);
      totalBookings++;
    }
    const status = b.status as string;
    if (status === "confirmed" || status === "completed") {
      const kDate = weekKey(b.date as string);
      if (revenueByWeek.has(kDate)) {
        revenueByWeek.set(kDate, (revenueByWeek.get(kDate) ?? 0) + (b.total_price as number));
      }
    }
  }

  const totalViews = Array.from(viewsByWeek.values()).reduce((a, b) => a + b, 0);
  const conversionRate = totalViews > 0 ? Math.round((totalBookings / totalViews) * 1000) / 10 : 0;

  return {
    views: buckets.map((w) => ({ weekStart: w, value: viewsByWeek.get(w) ?? 0 })),
    bookings: buckets.map((w) => ({ weekStart: w, value: bookingsByWeek.get(w) ?? 0 })),
    revenue: buckets.map((w) => ({ weekStart: w, value: revenueByWeek.get(w) ?? 0 })),
    conversionRate,
  };
}

// ---- Featured listings ----

export async function setListingFeatured(listingId: string, untilISO: string | null) {
  const { error } = await supabase
    .from("listings")
    .update({ featured_until: untilISO })
    .eq("id", listingId);
  return { error };
}

// ---- Двусторонние отзывы ----

export async function getReviewsAboutGuest(guestId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, author_id, listing_id, profiles!reviews_author_id_fkey(name, avatar_url)")
    .eq("target_user_id", guestId)
    .eq("target_type", "guest")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

export async function hasHostReviewedGuest(bookingId: string, hostId: string): Promise<boolean> {
  const { data } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("target_type", "guest")
    .eq("author_id", hostId)
    .maybeSingle();
  return !!data;
}

// ---- Reviews ----

export async function createReview(input: {
  listingId: string;
  bookingId: string;
  authorId: string;
  rating: number;
  text: string;
  targetType?: "listing" | "guest";
  targetUserId?: string;
}) {
  if (input.rating < 1 || input.rating > 5) {
    return { data: null, error: { message: "Рейтинг должен быть от 1 до 5" } };
  }
  const targetType = input.targetType ?? "listing";
  if (targetType === "guest" && !input.targetUserId) {
    return { data: null, error: { message: "Для отзыва о госте нужен targetUserId" } };
  }
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      listing_id: input.listingId,
      author_id: input.authorId,
      booking_id: input.bookingId,
      target_type: targetType,
      target_user_id: targetType === "guest" ? input.targetUserId! : null,
      rating: Math.round(input.rating),
      text: input.text.trim(),
    })
    .select()
    .single();
  return { data, error };
}

// true, если на эту бронь уже есть отзыв
export async function hasUserReviewedBooking(bookingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// Массовая проверка: возвращает Set bookingId, для которых отзыв уже есть
export async function getReviewedBookingIds(bookingIds: string[]): Promise<Set<string>> {
  if (bookingIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("reviews")
    .select("booking_id")
    .in("booking_id", bookingIds);
  if (error || !data) return new Set();
  return new Set(data.map((r: Record<string, unknown>) => r.booking_id as string));
}

export async function getHostProfile(hostId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, phone, role, avatar_url, response_rate, response_time, created_at")
    .eq("id", hostId)
    .single();

  if (error || !data) return null;
  return data as {
    id: string;
    name: string;
    phone: string | null;
    role: string;
    avatar_url: string | null;
    response_rate: number | null;
    response_time: string | null;
    created_at: string;
  };
}

export async function getHostActiveListings(hostId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url)")
    .eq("host_id", hostId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return rowToListing({
      ...row,
      host_name: profile?.name ?? "Хост",
      host_avatar: profile?.avatar_url ?? "",
      host_phone: profile?.phone ?? "",
    });
  });
}

export async function getHostListings(hostId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url)")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return mockListings.filter((l) => l.hostId === hostId);
  }

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return rowToListing({
      ...row,
      host_name: profile?.name ?? "Хост",
      host_avatar: profile?.avatar_url ?? "",
      host_phone: profile?.phone ?? "",
    });
  });
}

function generateSlug(title: string): string {
  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ы: "y", э: "e", ю: "yu", я: "ya",
    ъ: "", ь: "",
  };
  return title
    .toLowerCase()
    .split("")
    .map((c) => translitMap[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    + "-" + Date.now().toString(36);
}

export async function uploadListingImages(
  files: File[],
  hostId: string
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${hostId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("listings")
      .upload(path, file, { contentType: file.type });
    if (error) {
      console.error(`Upload failed for ${file.name}:`, error.message, "| error:", JSON.stringify(error));
      continue;
    }
    const { data: urlData } = supabase.storage
      .from("listings")
      .getPublicUrl(path);
    urls.push(urlData.publicUrl);
  }
  return urls;
}

export async function createListing(listing: {
  title: string;
  description: string;
  spaceType: string;
  activityTypes: string[];
  city: string;
  district: string;
  address: string;
  area: number;
  capacity: number;
  ceilingHeight: number;
  pricePerHour: number;
  pricePerDay?: number;
  minHours: number;
  styles: string[];
  amenities: string[];
  rules: string[];
  allows: {
    alcohol: boolean;
    loudMusic: boolean;
    pets: boolean;
    smoking: boolean;
    food: boolean;
  };
  images: string[];
  hostId: string;
}) {
  const slug = generateSlug(listing.title);

  // Геокодим адрес перед insert. Если 2GIS не отвечает — оставляем 0/0 и логируем.
  let lat = 0;
  let lng = 0;
  const geo = await geocodeAddress(listing.city, listing.address);
  if (geo) {
    lat = geo.lat;
    lng = geo.lng;
  } else {
    console.warn(`[geocoder] не удалось определить координаты для: ${listing.city}, ${listing.address}`);
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      title: listing.title,
      slug,
      description: listing.description,
      space_type: listing.spaceType,
      activity_types: listing.activityTypes,
      city: listing.city,
      district: listing.district,
      address: listing.address,
      lat,
      lng,
      area: listing.area,
      capacity: listing.capacity,
      ceiling_height: listing.ceilingHeight,
      price_per_hour: listing.pricePerHour,
      price_per_day: listing.pricePerDay || null,
      min_hours: listing.minHours,
      images: listing.images,
      styles: listing.styles,
      amenities: listing.amenities,
      rules: listing.rules,
      allows_alcohol: listing.allows.alcohol,
      allows_loud_music: listing.allows.loudMusic,
      allows_pets: listing.allows.pets,
      allows_smoking: listing.allows.smoking,
      allows_food: listing.allows.food,
      host_id: listing.hostId,
      status: "active",
      instant_book: false,
      superhost: false,
      rating: 0,
      review_count: 0,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateListingCoords(listingId: string, lat: number, lng: number) {
  const { error } = await supabase
    .from("listings")
    .update({ lat, lng })
    .eq("id", listingId);
  return { error };
}

export async function checkAvailability(
  listingId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("listing_id", listingId)
    .eq("date", date)
    .in("status", ["pending", "confirmed"])
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

  if (error) {
    console.error("Availability check error:", error);
    return true; // allow on error
  }
  return !data || data.length === 0;
}

export async function createBooking(booking: {
  listingId: string;
  renterId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  activityType: string;
  description: string;
  totalPrice: number;
  status: string;
  referralCode?: string;
}) {
  const commissionRate = booking.referralCode ? 0.03 : 0.15;
  const { data, error } = await supabase.from("bookings").insert({
    listing_id: booking.listingId,
    renter_id: booking.renterId,
    date: booking.date,
    start_time: booking.startTime,
    end_time: booking.endTime,
    guest_count: booking.guestCount,
    activity_type: booking.activityType,
    description: booking.description,
    total_price: booking.totalPrice,
    status: booking.status,
    referral_code: booking.referralCode || null,
    commission_rate: commissionRate,
    payment_status: "unpaid",
  }).select().single();

  return { data, error };
}

export async function getHostBookings(hostId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, listings!bookings_listing_id_fkey(title, slug, images, host_id)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // Filter by host's listings
  return data.filter((b: Record<string, unknown>) => {
    const listing = b.listings as Record<string, unknown> | null;
    return listing?.host_id === hostId;
  });
}

export async function getRenterBookings(renterId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, listings!bookings_listing_id_fkey(title, slug, images)")
    .eq("renter_id", renterId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

// У пользователя есть подтверждённая (или завершённая) бронь этой локации? → разрешает показать точный адрес
export async function hasUserConfirmedBookingForListing(
  userId: string,
  listingId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("renter_id", userId)
    .eq("listing_id", listingId)
    .in("status", ["confirmed", "completed"])
    .limit(1);
  if (error || !data) return false;
  return data.length > 0;
}

// ──────────── Blackouts (заблокированные хостом даты) ────────────

import type { ListingBlackout, HostBlackout, QuoteMetadata } from "./types";

function rowToBlackout(r: Record<string, unknown>): ListingBlackout {
  return {
    id: r.id as string,
    listingId: r.listing_id as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    reason: (r.reason as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function getListingBlackouts(listingId: string): Promise<ListingBlackout[]> {
  const { data, error } = await supabase
    .from("listing_blackouts")
    .select("id, listing_id, start_date, end_date, reason, created_at")
    .eq("listing_id", listingId)
    .order("start_date", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToBlackout);
}

export async function getHostBlackouts(hostId: string): Promise<HostBlackout[]> {
  const { data, error } = await supabase
    .from("listing_blackouts")
    .select("id, listing_id, start_date, end_date, reason, created_at, listings!listing_blackouts_listing_id_fkey(title, slug, host_id)")
    .order("start_date", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[])
    .filter((r) => {
      const l = r.listings as Record<string, unknown> | null;
      return l?.host_id === hostId;
    })
    .map((r) => {
      const l = r.listings as Record<string, unknown> | null;
      return {
        ...rowToBlackout(r),
        listingTitle: (l?.title as string) ?? "",
        listingSlug: (l?.slug as string) ?? "",
      };
    });
}

export async function createBlackout(input: {
  listingId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const { data, error } = await supabase
    .from("listing_blackouts")
    .insert({
      listing_id: input.listingId,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason || null,
    })
    .select()
    .single();
  return { data, error };
}

export async function deleteBlackout(blackoutId: string) {
  const { error } = await supabase
    .from("listing_blackouts")
    .delete()
    .eq("id", blackoutId);
  return { error };
}

// ──────────── Custom quotes (смета хоста в чате) ────────────

export async function createQuote(
  conversationId: string,
  hostId: string,
  input: { price: number; hours: number; validUntil?: string }
) {
  const meta: QuoteMetadata = {
    price: Math.round(input.price),
    hours: input.hours,
    status: "pending",
    ...(input.validUntil ? { valid_until: input.validUntil } : {}),
  };
  const summary = `Смета: ${new Intl.NumberFormat("ru-RU").format(meta.price)} ₸ за ${meta.hours} ч`;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: hostId,
      content: summary,
      type: "quote",
      metadata: meta as unknown as Record<string, unknown>,
    })
    .select()
    .single();
  return { data, error };
}

async function setQuoteStatus(messageId: string, status: "accepted" | "rejected") {
  const { data: existing, error: fetchErr } = await supabase
    .from("messages")
    .select("metadata")
    .eq("id", messageId)
    .single();
  if (fetchErr || !existing) return { error: fetchErr ?? { message: "Сообщение не найдено" } };
  const meta = (existing as Record<string, unknown>).metadata as QuoteMetadata;
  const updated: QuoteMetadata = { ...meta, status };
  const { error } = await supabase
    .from("messages")
    .update({ metadata: updated as unknown as Record<string, unknown> })
    .eq("id", messageId);
  return { error, quote: updated };
}

export async function acceptQuote(messageId: string) {
  return setQuoteStatus(messageId, "accepted");
}

export async function rejectQuote(messageId: string) {
  return setQuoteStatus(messageId, "rejected");
}

// Все активные брони (pending/confirmed) одной локации — для блокировки занятых слотов
export async function getListingBookings(listingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, date, start_time, end_time, status")
    .eq("listing_id", listingId)
    .in("status", ["pending", "confirmed"]);

  if (error || !data) return [];
  return data as Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: "pending" | "confirmed";
  }>;
}

export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, listing_id, renter_id, date, start_time, end_time, guest_count, activity_type, total_price, status, conversation_id, metadata, listings!bookings_listing_id_fkey(host_id, title)")
    .eq("id", bookingId)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function getBookingsByIds(bookingIds: string[]) {
  if (bookingIds.length === 0) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("id, listing_id, renter_id, date, start_time, end_time, guest_count, activity_type, total_price, status, conversation_id, metadata, listings!bookings_listing_id_fkey(host_id, title)")
    .in("id", bookingIds);
  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  return { error };
}

// ---- Scout Requests ----

export async function createScoutRequest(request: {
  listingId: string;
  guestId: string;
  requestedDate: string;
  message: string;
}) {
  const { data, error } = await supabase
    .from("scout_requests")
    .insert({
      listing_id: request.listingId,
      guest_id: request.guestId,
      requested_date: request.requestedDate,
      message: request.message,
      status: "pending",
    })
    .select()
    .single();

  return { data, error };
}

export async function getScoutRequestsForHost(hostId: string) {
  const { data, error } = await supabase
    .from("scout_requests")
    .select("*, listings!scout_requests_listing_id_fkey(title, slug, host_id), profiles!scout_requests_guest_id_fkey(name, phone)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).filter((r) => {
    const listing = r.listings as Record<string, unknown> | null;
    return listing?.host_id === hostId;
  });
}

export async function updateScoutRequestStatus(requestId: string, status: string, hostResponse?: string) {
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (hostResponse) updateData.host_response = hostResponse;

  const { error } = await supabase
    .from("scout_requests")
    .update(updateData)
    .eq("id", requestId);

  return { error };
}

export async function getGuestScoutRequests(guestId: string) {
  const { data, error } = await supabase
    .from("scout_requests")
    .select("*, listings!scout_requests_listing_id_fkey(title, slug, images)")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

// ---- Conversations & Messages ----

export async function getOrCreateConversation(listingId: string, guestId: string, hostId: string) {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("guest_id", guestId)
    .single();

  if (existing) return { id: existing.id as string, isNew: false };

  // Create new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, guest_id: guestId, host_id: hostId })
    .select("id")
    .single();

  if (error) {
    console.error("Create conversation error:", error.message);
    return null;
  }

  return { id: (data as Record<string, unknown>).id as string, isNew: true };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  opts?: { type?: "text" | "system"; bookingId?: string | null }
) {
  const type = opts?.type ?? "text";
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type,
      booking_id: opts?.bookingId ?? null,
    })
    .select()
    .single();

  // Email получателю — только для обычных text-сообщений + rate-limit 5 мин на conversation
  if (!error && type === "text") {
    void (async () => {
      try {
        const last = messageEmailLastSent.get(conversationId) ?? 0;
        if (Date.now() - last < MESSAGE_EMAIL_COOLDOWN_MS) return;

        const { data: convo } = await supabase
          .from("conversations")
          .select("guest_id, host_id, listings!conversations_listing_id_fkey(title)")
          .eq("id", conversationId)
          .single();
        if (!convo) return;
        const c = convo as Record<string, unknown>;
        const guestId = c.guest_id as string;
        const hostId = c.host_id as string;
        const recipientId = senderId === hostId ? guestId : hostId;
        const listing = c.listings as Record<string, unknown> | null;
        const listingTitle = (listing?.title as string) ?? "локация";

        const [recipient, sender] = await Promise.all([
          getUserEmailName(recipientId),
          getUserEmailName(senderId),
        ]);
        if (!recipient?.email) return;

        messageEmailLastSent.set(conversationId, Date.now());
        await sendNewMessageEmail({
          to: recipient.email,
          recipientName: recipient.name,
          senderName: sender?.name ?? "Пользователь",
          listingTitle,
          snippet: content.slice(0, 120),
          inboxUrl: `${SITE_URL}/inbox?c=${conversationId}`,
        });
      } catch (e) {
        console.error("[email] new-message failed:", e);
      }
    })();
  }

  return { data, error };
}

// Создать запрос на бронирование + системное сообщение в чат
export async function createBookingRequest(input: {
  listingId: string;
  renterId: string;
  hostId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  activityType: string;
  description: string;
  totalPrice: number;
  referralCode?: string;
  metadata?: Record<string, unknown>;
}) {
  // 1. Получаем/создаём conversation
  const convo = await getOrCreateConversation(input.listingId, input.renterId, input.hostId);
  if (!convo) return { data: null, error: { message: "Не удалось создать диалог" } };

  // 2. Создаём бронирование со статусом pending
  const commissionRate = input.referralCode ? 0.03 : 0.15;
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      listing_id: input.listingId,
      renter_id: input.renterId,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      guest_count: input.guestCount,
      activity_type: input.activityType,
      description: input.description,
      total_price: input.totalPrice,
      status: "pending",
      conversation_id: convo.id,
      referral_code: input.referralCode || null,
      commission_rate: commissionRate,
      payment_status: "unpaid",
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return { data: null, error: bookingError ?? { message: "Не удалось создать бронь" } };
  }

  const bookingId = (booking as Record<string, unknown>).id as string;

  // 3. Системное сообщение в чат со ссылкой на booking_id
  const summary = `Запрос на бронирование · ${input.date} ${input.startTime}–${input.endTime} · ${input.guestCount} гостей`;
  await sendMessage(convo.id, input.renterId, summary, {
    type: "system",
    bookingId,
  });

  // 4. Email хосту (fire-and-forget)
  void (async () => {
    try {
      const [host, renter, listing] = await Promise.all([
        getUserEmailName(input.hostId),
        getUserEmailName(input.renterId),
        supabase.from("listings").select("title").eq("id", input.listingId).single(),
      ]);
      const listingTitle = ((listing.data as Record<string, unknown> | null)?.title as string) ?? "локация";
      if (host?.email) {
        await sendBookingPendingEmail({
          to: host.email,
          hostName: host.name,
          listingTitle,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          guestName: renter?.name ?? "Гость",
          totalPrice: input.totalPrice,
          dashboardUrl: `${SITE_URL}/dashboard`,
        });
      }
    } catch (e) {
      console.error("[email] booking-pending failed:", e);
    }
  })();

  return {
    data: { bookingId, conversationId: convo.id, isNewConversation: convo.isNew },
    error: null,
  };
}

// Хост подтверждает или отклоняет бронь — пишет системное сообщение
export async function respondToBooking(
  bookingId: string,
  status: "confirmed" | "rejected",
  hostId: string
) {
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("conversation_id, listing_id, renter_id")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: fetchError ?? { message: "Бронь не найдена" } };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (updateError) return { error: updateError };

  let conversationId = (booking as Record<string, unknown>).conversation_id as string | null;

  // Fallback: если у старых броней нет conversation_id — найдём по (listing, renter)
  if (!conversationId) {
    const listingId = (booking as Record<string, unknown>).listing_id as string;
    const renterId = (booking as Record<string, unknown>).renter_id as string;
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("guest_id", renterId)
      .single();
    conversationId = (convo as Record<string, unknown> | null)?.id as string | null;
  }

  if (conversationId) {
    const text =
      status === "confirmed"
        ? "Бронь подтверждена хостом ✓"
        : "Хост отклонил запрос на бронирование";
    await sendMessage(conversationId, hostId, text, {
      type: "system",
      bookingId,
    });
  }

  // Email арендатору (fire-and-forget)
  void (async () => {
    try {
      const renterId = (booking as Record<string, unknown>).renter_id as string;
      const listingId = (booking as Record<string, unknown>).listing_id as string;
      const [renter, host, listingRes, fullBooking] = await Promise.all([
        getUserEmailName(renterId),
        getUserEmailName(hostId),
        supabase.from("listings").select("title, slug").eq("id", listingId).single(),
        supabase.from("bookings").select("date, start_time, end_time").eq("id", bookingId).single(),
      ]);
      if (!renter?.email) return;
      const listing = listingRes.data as Record<string, unknown> | null;
      const title = (listing?.title as string) ?? "локация";
      const slug = (listing?.slug as string) ?? "";
      if (status === "confirmed") {
        const b = fullBooking.data as Record<string, unknown> | null;
        await sendBookingConfirmedEmail({
          to: renter.email,
          renterName: renter.name,
          listingTitle: title,
          date: (b?.date as string) ?? "",
          startTime: (b?.start_time as string) ?? "",
          endTime: (b?.end_time as string) ?? "",
          hostName: host?.name ?? "Хост",
          listingUrl: `${SITE_URL}/listing/${slug}`,
        });
      } else {
        await sendBookingRejectedEmail({
          to: renter.email,
          renterName: renter.name,
          listingTitle: title,
          hostName: host?.name ?? "Хост",
        });
      }
    } catch (e) {
      console.error(`[email] booking-${status} failed:`, e);
    }
  })();

  return { error: null };
}

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      listing_id,
      guest_id,
      host_id,
      updated_at,
      listings!conversations_listing_id_fkey(title, slug, images),
      guest:profiles!conversations_guest_id_fkey(name, avatar_url),
      host:profiles!conversations_host_id_fkey(name, avatar_url)
    `)
    .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, is_read, type, booking_id, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

export async function markMessagesRead(conversationId: string, userId: string) {
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("is_read", false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  // Get all conversations for user
  const { data: convos } = await supabase
    .from("conversations")
    .select("id")
    .or(`guest_id.eq.${userId},host_id.eq.${userId}`);

  if (!convos || convos.length === 0) return 0;

  const ids = convos.map((c: Record<string, unknown>) => c.id as string);
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .neq("sender_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}

// ---- Payments ----

export async function createPayment(booking: {
  id: string;
  total_price: number;
  commission_rate: number;
}) {
  const amount = booking.total_price;
  const serviceFee = Math.round(amount * 0.075);
  const baseAmount = amount - serviceFee;
  const commissionAmount = Math.round(baseAmount * (booking.commission_rate as number));
  const hostAmount = baseAmount - commissionAmount;

  const { data, error } = await supabase.from("payments").insert({
    booking_id: booking.id,
    amount,
    service_fee: serviceFee,
    commission_amount: commissionAmount,
    host_amount: hostAmount,
    commission_rate: booking.commission_rate,
    method: "kaspi_pay",
    status: "pending",
  }).select().single();

  return { data, error };
}

export async function confirmPayment(paymentId: string, kaspiTxnId?: string) {
  const { error } = await supabase.from("payments")
    .update({
      status: "completed",
      paid_at: new Date().toISOString(),
      kaspi_txn_id: kaspiTxnId || null,
    })
    .eq("id", paymentId);

  if (!error) {
    // Also update booking payment status
    const { data: payment } = await supabase.from("payments")
      .select("booking_id")
      .eq("id", paymentId)
      .single();

    if (payment) {
      await supabase.from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", (payment as Record<string, unknown>).booking_id);
    }
  }

  return { error };
}

export async function getPaymentByBookingId(bookingId: string) {
  const { data, error } = await supabase.from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .single();
  return { data, error };
}

// ---- Payouts ----

export async function getPendingPayouts() {
  // Find completed bookings where date has passed, payment is done, and no payout yet
  const today = new Date().toISOString().split("T")[0];

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, listing_id, total_price, commission_rate, date, listings!bookings_listing_id_fkey(host_id)")
    .eq("payment_status", "paid")
    .in("status", ["confirmed", "completed"])
    .lte("date", today);

  if (error || !bookings) return [];

  // Check which bookings already have payouts
  const bookingIds = bookings.map((b: Record<string, unknown>) => b.id as string);
  const { data: existingPayouts } = await supabase
    .from("payouts")
    .select("booking_ids")
    .in("status", ["pending", "processing", "completed"]);

  const paidBookingIds = new Set<string>();
  if (existingPayouts) {
    for (const p of existingPayouts) {
      for (const bid of (p as Record<string, unknown>).booking_ids as string[]) {
        paidBookingIds.add(bid);
      }
    }
  }

  // Group unpaid bookings by host
  const hostPayouts: Record<string, { amount: number; bookingIds: string[] }> = {};

  for (const b of bookings) {
    const booking = b as Record<string, unknown>;
    if (paidBookingIds.has(booking.id as string)) continue;

    const listing = booking.listings as Record<string, unknown> | null;
    if (!listing) continue;

    const hostId = listing.host_id as string;
    const totalPrice = booking.total_price as number;
    const commRate = booking.commission_rate as number;
    const serviceFee = Math.round(totalPrice * 0.075);
    const base = totalPrice - serviceFee;
    const hostAmount = base - Math.round(base * commRate);

    if (!hostPayouts[hostId]) hostPayouts[hostId] = { amount: 0, bookingIds: [] };
    hostPayouts[hostId].amount += hostAmount;
    hostPayouts[hostId].bookingIds.push(booking.id as string);
  }

  return Object.entries(hostPayouts).map(([hostId, data]) => ({
    hostId,
    amount: data.amount,
    bookingIds: data.bookingIds,
  }));
}

export async function createPayout(hostId: string, amount: number, bookingIds: string[], kaspiPhone: string) {
  const { data, error } = await supabase.from("payouts").insert({
    host_id: hostId,
    amount,
    booking_ids: bookingIds,
    status: "pending",
    method: "kaspi_transfer",
    kaspi_phone: kaspiPhone,
  }).select().single();

  return { data, error };
}

export async function completePayout(payoutId: string) {
  const { error } = await supabase.from("payouts")
    .update({ status: "completed", processed_at: new Date().toISOString() })
    .eq("id", payoutId);
  return { error };
}

// ---- Admin ----

export async function getAdminStats() {
  const [paymentsRes, payoutsRes, bookingsRes] = await Promise.all([
    supabase.from("payments").select("*").eq("status", "completed"),
    supabase.from("payouts").select("*"),
    supabase.from("bookings").select("id, total_price, commission_rate, payment_status, status, date, created_at, referral_code, listings!bookings_listing_id_fkey(title, host_id), profiles!bookings_renter_id_fkey(name)").order("created_at", { ascending: false }),
  ]);

  return {
    payments: (paymentsRes.data ?? []) as Array<Record<string, unknown>>,
    payouts: (payoutsRes.data ?? []) as Array<Record<string, unknown>>,
    bookings: (bookingsRes.data ?? []) as Array<Record<string, unknown>>,
  };
}

export async function getAllPayouts() {
  const { data, error } = await supabase
    .from("payouts")
    .select("*, profiles!payouts_host_id_fkey(name, phone)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  return (data as Record<string, unknown> | null)?.is_admin === true;
}
