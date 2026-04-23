import { supabase } from "./supabase";
import { listings as mockListings, reviews as mockReviews } from "./mock-data";
import type { Listing, Review } from "./types";
import { geocodeAddress } from "./geocoder";
import {
  sendBookingPendingEmail,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
  sendNewMessageEmail,
  sendListingApprovedEmail,
  sendListingRejectedEmail,
} from "./email";
import { sanitizeMessage } from "./sanitize-message";

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
    powerKw: (row.power_kw as number | null) ?? null,
    parkingCapacity: (row.parking_capacity as number | null) ?? null,
    hasFreightAccess: (row.has_freight_access as boolean) ?? false,
    hasLoadingDock: (row.has_loading_dock as boolean) ?? false,
    hasWhiteCyc: (row.has_white_cyc as boolean) ?? false,
    securityDeposit: (row.security_deposit as number) ?? 0,
    hostIdVerified: (row.host_id_verified as boolean) ?? false,
    hostPhoneVerified: (row.host_phone_verified as boolean) ?? false,
    hostCreatedAt: (row.host_created_at as string | null) ?? undefined,
    moderationStatus: (row.moderation_status as Listing["moderationStatus"]) ?? "approved",
    moderationNote: (row.moderation_note as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at)")
    .eq("status", "active")
    .eq("moderation_status", "approved")
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
      host_id_verified: profile?.id_verified ?? false,
      host_phone_verified: profile?.phone_verified ?? false,
      host_created_at: profile?.created_at ?? null,
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
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at)")
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
      host_id_verified: profile?.id_verified ?? false,
      host_phone_verified: profile?.phone_verified ?? false,
      host_created_at: profile?.created_at ?? null,
    host_phone: profile?.phone ?? "",
  });
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const profile = (data as Record<string, unknown>).profiles as Record<string, unknown> | null;
  return rowToListing({
    ...(data as Record<string, unknown>),
    host_name: profile?.name ?? "Хост",
    host_avatar: profile?.avatar_url ?? "",
    host_id_verified: profile?.id_verified ?? false,
    host_phone_verified: profile?.phone_verified ?? false,
    host_created_at: profile?.created_at ?? null,
    host_phone: profile?.phone ?? "",
  });
}

export async function updateListing(
  listingId: string,
  hostId: string,
  fields: {
    title?: string;
    description?: string;
    spaceType?: string;
    activityTypes?: string[];
    city?: string;
    district?: string;
    address?: string;
    area?: number;
    capacity?: number;
    ceilingHeight?: number;
    pricePerHour?: number;
    pricePerDay?: number | null;
    securityDeposit?: number;
    minHours?: number;
    styles?: string[];
    amenities?: string[];
    rules?: string[];
    allows?: {
      alcohol: boolean;
      loudMusic: boolean;
      pets: boolean;
      smoking: boolean;
      food: boolean;
    };
    images?: string[];
  }
) {
  const update: Record<string, unknown> = {};
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.spaceType !== undefined) update.space_type = fields.spaceType;
  if (fields.activityTypes !== undefined) update.activity_types = fields.activityTypes;
  if (fields.city !== undefined) update.city = fields.city;
  if (fields.district !== undefined) update.district = fields.district;
  if (fields.address !== undefined) update.address = fields.address;
  if (fields.area !== undefined) update.area = fields.area;
  if (fields.capacity !== undefined) update.capacity = fields.capacity;
  if (fields.ceilingHeight !== undefined) update.ceiling_height = fields.ceilingHeight;
  if (fields.pricePerHour !== undefined) update.price_per_hour = fields.pricePerHour;
  if (fields.pricePerDay !== undefined) update.price_per_day = fields.pricePerDay;
  if (fields.securityDeposit !== undefined) update.security_deposit = fields.securityDeposit;
  if (fields.minHours !== undefined) update.min_hours = fields.minHours;
  if (fields.styles !== undefined) update.styles = fields.styles;
  if (fields.amenities !== undefined) update.amenities = fields.amenities;
  if (fields.rules !== undefined) update.rules = fields.rules;
  if (fields.allows !== undefined) {
    update.allows_alcohol = fields.allows.alcohol;
    update.allows_loud_music = fields.allows.loudMusic;
    update.allows_pets = fields.allows.pets;
    update.allows_smoking = fields.allows.smoking;
    update.allows_food = fields.allows.food;
  }
  if (fields.images !== undefined) update.images = fields.images;

  const { error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", listingId)
    .eq("host_id", hostId); // security: only owner can update

  return { error };
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
    .select("created_at, listings!favorites_listing_id_fkey(*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at))")
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
      host_id_verified: profile?.id_verified ?? false,
      host_phone_verified: profile?.phone_verified ?? false,
      host_created_at: profile?.created_at ?? null,
        host_phone: profile?.phone ?? "",
      });
    })
    .filter((l): l is Listing => l !== null);
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at)")
    .in("id", ids);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return rowToListing({
      ...row,
      host_name: profile?.name ?? "Хост",
      host_avatar: profile?.avatar_url ?? "",
      host_id_verified: profile?.id_verified ?? false,
      host_phone_verified: profile?.phone_verified ?? false,
      host_created_at: profile?.created_at ?? null,
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
    .select("id, name, phone, role, avatar_url, response_rate, response_time, created_at, id_verified, phone_verified, bio, instagram, telegram")
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
    id_verified: boolean;
    bio: string | null;
    instagram: string | null;
    telegram: string | null;
  };
}

export async function getHostActiveListings(hostId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at)")
    .eq("host_id", hostId)
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return rowToListing({
      ...row,
      host_name: profile?.name ?? "Хост",
      host_avatar: profile?.avatar_url ?? "",
      host_id_verified: profile?.id_verified ?? false,
      host_phone_verified: profile?.phone_verified ?? false,
      host_created_at: profile?.created_at ?? null,
      host_phone: profile?.phone ?? "",
    });
  });
}

export async function getHostListings(hostId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles!listings_host_id_fkey(name, phone, avatar_url, id_verified, phone_verified, created_at)")
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
      host_id_verified: profile?.id_verified ?? false,
      host_phone_verified: profile?.phone_verified ?? false,
      host_created_at: profile?.created_at ?? null,
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
  powerKw?: number;
  parkingCapacity?: number;
  hasFreightAccess?: boolean;
  hasLoadingDock?: boolean;
  hasWhiteCyc?: boolean;
  securityDeposit?: number;
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
      moderation_status: "pending_review",
      instant_book: false,
      superhost: false,
      rating: 0,
      review_count: 0,
      power_kw: listing.powerKw ?? null,
      parking_capacity: listing.parkingCapacity ?? null,
      has_freight_access: listing.hasFreightAccess ?? false,
      has_loading_dock: listing.hasLoadingDock ?? false,
      has_white_cyc: listing.hasWhiteCyc ?? false,
      security_deposit: listing.securityDeposit ?? 0,
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

  // Sanitize text messages — skip system/quote messages
  let finalContent = content;
  let contactBlocked = false;

  if (type === "text") {
    // Check if this conversation has a confirmed/completed booking (contacts allowed)
    const { data: convo } = await supabase
      .from("conversations")
      .select("guest_id, host_id, listing_id")
      .eq("id", conversationId)
      .single();

    let hasConfirmedBooking = false;
    if (convo) {
      const c = convo as Record<string, unknown>;
      const { data: confirmed } = await supabase
        .from("bookings")
        .select("id")
        .eq("listing_id", c.listing_id as string)
        .eq("renter_id", c.guest_id as string)
        .in("status", ["confirmed", "completed"])
        .limit(1);
      hasConfirmedBooking = !!confirmed && confirmed.length > 0;
    }

    if (!hasConfirmedBooking) {
      const result = sanitizeMessage(content);
      finalContent = result.text;
      contactBlocked = result.blocked;
    }
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: finalContent,
      type,
      booking_id: opts?.bookingId ?? null,
    })
    .select()
    .single();

  // Return contactBlocked so UI can show a warning
  if (contactBlocked && !error) {
    return { data, error, contactBlocked: true };
  }

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
  promoCode?: string;
  discountAmount?: number;
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
      promo_code: input.promoCode || null,
      discount_amount: input.discountAmount || 0,
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

  // 2b. Increment promo code usage
  if (input.promoCode) {
    void incrementPromoCodeUsage(input.promoCode);
  }

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

export async function cancelBooking(bookingId: string, renterId: string) {
  // Verify ownership
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, renter_id, conversation_id")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) return { error: fetchError ?? { message: "Бронь не найдена" } };

  const row = booking as Record<string, unknown>;
  if (row.renter_id !== renterId) return { error: { message: "Нет доступа" } };

  const status = row.status as string;
  if (status !== "pending" && status !== "confirmed") {
    return { error: { message: "Эту бронь нельзя отменить" } };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateError) return { error: updateError };

  // System message in conversation
  const conversationId = row.conversation_id as string | null;
  if (conversationId) {
    await sendMessage(conversationId, renterId, "Арендатор отменил бронирование", {
      type: "system",
      bookingId,
    });
  }

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

// ---- Admin: User Management ----

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneVerified: boolean;
  role: string;
  avatarUrl: string | null;
  idVerified: boolean;
  suspended: boolean;
  suspendReason: string | null;
  createdAt: string;
  listingCount: number;
  bookingCount: number;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, phone_verified, role, avatar_url, id_verified, suspended, suspend_reason, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const users = data as Array<Record<string, unknown>>;
  const userIds = users.map((u) => u.id as string);

  // Count listings per host
  const { data: listingsData } = await supabase
    .from("listings")
    .select("host_id")
    .in("host_id", userIds);

  const listingCounts = new Map<string, number>();
  for (const l of (listingsData ?? []) as Array<Record<string, unknown>>) {
    const hid = l.host_id as string;
    listingCounts.set(hid, (listingCounts.get(hid) ?? 0) + 1);
  }

  // Count bookings per renter
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("renter_id")
    .in("renter_id", userIds);

  const bookingCounts = new Map<string, number>();
  for (const b of (bookingsData ?? []) as Array<Record<string, unknown>>) {
    const rid = b.renter_id as string;
    bookingCounts.set(rid, (bookingCounts.get(rid) ?? 0) + 1);
  }

  return users.map((u) => ({
    id: u.id as string,
    name: (u.name as string) ?? "—",
    email: (u.email as string | null) ?? null,
    phone: (u.phone as string | null) ?? null,
    phoneVerified: (u.phone_verified as boolean) ?? false,
    role: (u.role as string) ?? "renter",
    avatarUrl: (u.avatar_url as string | null) ?? null,
    idVerified: (u.id_verified as boolean) ?? false,
    suspended: (u.suspended as boolean) ?? false,
    suspendReason: (u.suspend_reason as string | null) ?? null,
    createdAt: u.created_at as string,
    listingCount: listingCounts.get(u.id as string) ?? 0,
    bookingCount: bookingCounts.get(u.id as string) ?? 0,
  }));
}

export async function suspendUser(userId: string, reason: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      suspended: true,
      suspended_at: new Date().toISOString(),
      suspend_reason: reason || null,
    })
    .eq("id", userId);
  return { error };
}

export async function unsuspendUser(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      suspended: false,
      suspended_at: null,
      suspend_reason: null,
    })
    .eq("id", userId);
  return { error };
}

// ---- Admin ----

export async function getAdminStats() {
  const [paymentsRes, payoutsRes, bookingsRes] = await Promise.all([
    supabase.from("payments").select("*").eq("status", "completed"),
    supabase.from("payouts").select("*"),
    supabase.from("bookings").select("id, total_price, commission_rate, payment_status, status, date, created_at, referral_code, conversation_id, listings!bookings_listing_id_fkey(title, host_id), profiles!bookings_renter_id_fkey(name)").order("created_at", { ascending: false }),
  ]);

  return {
    payments: (paymentsRes.data ?? []) as Array<Record<string, unknown>>,
    payouts: (payoutsRes.data ?? []) as Array<Record<string, unknown>>,
    bookings: (bookingsRes.data ?? []) as Array<Record<string, unknown>>,
  };
}

export async function getAdminOverviewStats(): Promise<{
  totalUsers: number;
  hostCount: number;
  renterCount: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalViews: number;
}> {
  const [usersRes, listingsRes, viewsRes] = await Promise.all([
    supabase.from("profiles").select("role"),
    supabase.from("listings").select("status, moderation_status"),
    supabase.from("listing_views").select("id", { count: "exact", head: true }),
  ]);

  const users = (usersRes.data ?? []) as Array<Record<string, unknown>>;
  const listings = (listingsRes.data ?? []) as Array<Record<string, unknown>>;

  return {
    totalUsers: users.length,
    hostCount: users.filter((u) => u.role === "host").length,
    renterCount: users.filter((u) => u.role === "renter").length,
    totalListings: listings.length,
    activeListings: listings.filter((l) => l.status === "active" && l.moderation_status === "approved").length,
    pendingListings: listings.filter((l) => l.moderation_status === "pending_review").length,
    totalViews: viewsRes.count ?? 0,
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

// ──────────── Host verifications ────────────

import type { HostVerification } from "./types";

function rowToVerification(r: Record<string, unknown>): HostVerification {
  return {
    id: r.id as string,
    hostId: r.host_id as string,
    idDocUrl: (r.id_doc_url as string | null) ?? null,
    selfieUrl: (r.selfie_url as string | null) ?? null,
    status: r.status as HostVerification["status"],
    reviewerNote: (r.reviewer_note as string | null) ?? null,
    submittedAt: r.submitted_at as string,
    reviewedAt: (r.reviewed_at as string | null) ?? null,
    entityType: (r.entity_type as "individual" | "company") ?? "individual",
    iin: (r.iin as string | null) ?? null,
    companyBin: (r.company_bin as string | null) ?? null,
    companyName: (r.company_name as string | null) ?? null,
    companyDocUrl: (r.company_doc_url as string | null) ?? null,
    userRole: (r.user_role as string | null) ?? null,
  };
}

export async function uploadVerificationFile(
  userId: string,
  kind: "id" | "selfie" | "company_doc",
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${kind}.${ext}`;
  const { error } = await supabase.storage
    .from("verifications")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) {
    console.error("uploadVerificationFile:", error.message);
    return null;
  }
  // Bucket приватный — генерим signed URL на 7 дней (для админ-превью)
  const { data: signed } = await supabase.storage
    .from("verifications")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return signed?.signedUrl ?? null;
}

export async function submitHostVerification(
  userId: string,
  idDocUrl: string,
  selfieUrl: string
) {
  return submitVerification(userId, { idDocUrl, selfieUrl });
}

export async function submitVerification(
  userId: string,
  input: {
    idDocUrl: string;
    selfieUrl: string;
    entityType?: "individual" | "company";
    iin?: string;
    companyBin?: string;
    companyName?: string;
    companyDocUrl?: string | null;
    userRole?: string;
  }
) {
  const { data, error } = await supabase
    .from("host_verifications")
    .upsert(
      {
        host_id: userId,
        id_doc_url: input.idDocUrl,
        selfie_url: input.selfieUrl,
        status: "pending",
        reviewer_note: null,
        entity_type: input.entityType ?? "individual",
        iin: input.iin ?? null,
        company_bin: input.companyBin ?? null,
        company_name: input.companyName ?? null,
        company_doc_url: input.companyDocUrl ?? null,
        user_role: input.userRole ?? null,
      },
      { onConflict: "host_id" }
    )
    .select()
    .single();
  return { data, error };
}

export async function getMyVerification(userId: string): Promise<HostVerification | null> {
  const { data } = await supabase
    .from("host_verifications")
    .select("*")
    .eq("host_id", userId)
    .maybeSingle();
  if (!data) return null;
  return rowToVerification(data as Record<string, unknown>);
}

export async function getAllPendingVerifications(): Promise<Array<HostVerification & { hostName: string; hostEmail: string | null; hostRole: string }>> {
  const { data, error } = await supabase
    .from("host_verifications")
    .select("*, profiles!host_verifications_host_id_fkey(name, email, role)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => {
    const p = r.profiles as Record<string, unknown> | null;
    return {
      ...rowToVerification(r),
      hostName: (p?.name as string) ?? "",
      hostEmail: (p?.email as string | null) ?? null,
      hostRole: (p?.role as string) ?? "host",
    };
  });
}

export async function reviewVerification(
  verificationId: string,
  status: "verified" | "rejected",
  note?: string
) {
  const { error } = await supabase
    .from("host_verifications")
    .update({
      status,
      reviewer_note: note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId);
  return { error };
}

// ──────────── Production-параметры (мини-обновление существующей локации) ────────────

export async function updateListingProductionFields(
  listingId: string,
  fields: {
    powerKw?: number | null;
    parkingCapacity?: number | null;
    hasFreightAccess?: boolean;
    hasLoadingDock?: boolean;
    hasWhiteCyc?: boolean;
  }
) {
  const { error } = await supabase
    .from("listings")
    .update({
      power_kw: fields.powerKw ?? null,
      parking_capacity: fields.parkingCapacity ?? null,
      has_freight_access: fields.hasFreightAccess ?? false,
      has_loading_dock: fields.hasLoadingDock ?? false,
      has_white_cyc: fields.hasWhiteCyc ?? false,
    })
    .eq("id", listingId);
  return { error };
}

// ──────────── Invoice data ────────────

export interface InvoiceData {
  booking: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    commission_rate: number | null;
    metadata?: Record<string, unknown>;
  };
  listing: {
    title: string;
    address: string;
    city: string;
  };
  host: {
    name: string;
    company_name: string | null;
    company_bin: string | null;
    company_address: string | null;
  };
  renter: {
    name: string;
    email: string | null;
    company_name: string | null;
    company_bin: string | null;
    company_address: string | null;
  };
}

export async function getInvoiceDataForBooking(bookingId: string): Promise<InvoiceData | null> {
  const { data: b } = await supabase
    .from("bookings")
    .select("id, date, start_time, end_time, total_price, commission_rate, metadata, status, listing_id, renter_id, listings!bookings_listing_id_fkey(title, address, city, host_id)")
    .eq("id", bookingId)
    .single();
  if (!b) return null;
  const row = b as Record<string, unknown>;
  const status = row.status as string;
  if (status !== "confirmed" && status !== "completed") return null;

  const listing = row.listings as Record<string, unknown> | null;
  if (!listing) return null;
  const hostId = listing.host_id as string;
  const renterId = row.renter_id as string;

  const [hostRes, renterRes] = await Promise.all([
    supabase.from("profiles").select("name, company_name, company_bin, company_address").eq("id", hostId).single(),
    supabase.from("profiles").select("name, email, company_name, company_bin, company_address").eq("id", renterId).single(),
  ]);

  const host = hostRes.data as Record<string, unknown> | null;
  const renter = renterRes.data as Record<string, unknown> | null;
  if (!host || !renter) return null;

  return {
    booking: {
      id: row.id as string,
      date: row.date as string,
      start_time: row.start_time as string,
      end_time: row.end_time as string,
      total_price: row.total_price as number,
      commission_rate: (row.commission_rate as number | null) ?? null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    },
    listing: {
      title: listing.title as string,
      address: listing.address as string,
      city: listing.city as string,
    },
    host: {
      name: host.name as string,
      company_name: (host.company_name as string | null) ?? null,
      company_bin: (host.company_bin as string | null) ?? null,
      company_address: (host.company_address as string | null) ?? null,
    },
    renter: {
      name: renter.name as string,
      email: (renter.email as string | null) ?? null,
      company_name: (renter.company_name as string | null) ?? null,
      company_bin: (renter.company_bin as string | null) ?? null,
      company_address: (renter.company_address as string | null) ?? null,
    },
  };
}

// Также — обновление B2B-данных профиля
export async function updateProfileBilling(userId: string, fields: {
  companyName?: string;
  companyBin?: string;
  companyAddress?: string;
}) {
  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: fields.companyName ?? null,
      company_bin: fields.companyBin ?? null,
      company_address: fields.companyAddress ?? null,
    })
    .eq("id", userId);
  return { error };
}

// ---- Site Settings ----

export type SiteSettings = Record<string, string>;

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value");
  if (error || !data) return {};
  const map: SiteSettings = {};
  for (const row of data) {
    map[row.key as string] = row.value as string;
  }
  return map;
}

export async function updateSiteSetting(key: string, value: string) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  return { error };
}

// ---- Listing Discounts ----

export interface ListingDiscount {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  discountPercent: number;
  createdAt: string;
}

export async function getListingDiscounts(listingId: string): Promise<ListingDiscount[]> {
  const { data, error } = await supabase
    .from("listing_discounts")
    .select("*")
    .eq("listing_id", listingId)
    .order("start_date", { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    listingId: r.listing_id as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    discountPercent: r.discount_percent as number,
    createdAt: r.created_at as string,
  }));
}

export async function createListingDiscount(
  listingId: string,
  startDate: string,
  endDate: string,
  discountPercent: number
) {
  const { data, error } = await supabase
    .from("listing_discounts")
    .insert({
      listing_id: listingId,
      start_date: startDate,
      end_date: endDate,
      discount_percent: discountPercent,
    })
    .select()
    .single();
  return { data, error };
}

export async function deleteListingDiscount(id: string) {
  const { error } = await supabase
    .from("listing_discounts")
    .delete()
    .eq("id", id);
  return { error };
}

export async function getDiscountForDate(listingId: string, date: string): Promise<number> {
  const { data } = await supabase
    .from("listing_discounts")
    .select("discount_percent")
    .eq("listing_id", listingId)
    .lte("start_date", date)
    .gte("end_date", date)
    .order("discount_percent", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return 0;
  return (data as Record<string, unknown>).discount_percent as number;
}

// ---- Claims (damage claims by hosts) ----

export interface Claim {
  id: string;
  bookingId: string;
  hostId: string;
  hostName: string;
  description: string;
  damageAmount: number;
  photos: string[];
  status: "open" | "approved" | "rejected";
  resolution: string | null;
  depositHeld: boolean;
  fundPayout: number;
  createdAt: string;
  resolvedAt: string | null;
  listingTitle: string;
  securityDeposit: number;
  conversationId: string | null;
}

export async function uploadClaimPhoto(hostId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${hostId}/claim-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("verifications") // reuse private bucket
    .upload(path, file, { contentType: file.type });
  if (error) {
    console.error("uploadClaimPhoto:", error.message);
    return null;
  }
  const { data: signed } = await supabase.storage
    .from("verifications")
    .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
  return signed?.signedUrl ?? null;
}

export async function createClaim(input: {
  bookingId: string;
  hostId: string;
  description: string;
  damageAmount: number;
  photos: string[];
}) {
  const { data, error } = await supabase
    .from("claims")
    .insert({
      booking_id: input.bookingId,
      host_id: input.hostId,
      description: input.description,
      damage_amount: input.damageAmount,
      photos: input.photos,
    })
    .select()
    .single();
  return { data, error };
}

export async function getHostClaims(hostId: string): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("*, bookings!claims_booking_id_fkey(conversation_id, metadata, listings!bookings_listing_id_fkey(title))")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => {
    const booking = r.bookings as Record<string, unknown> | null;
    const listing = booking?.listings as Record<string, unknown> | null;
    const meta = booking?.metadata as Record<string, unknown> | null;
    return {
      id: r.id as string,
      bookingId: r.booking_id as string,
      hostId: r.host_id as string,
      hostName: "",
      description: r.description as string,
      damageAmount: r.damage_amount as number,
      photos: (r.photos as string[]) ?? [],
      status: r.status as Claim["status"],
      resolution: (r.resolution as string | null) ?? null,
      depositHeld: (r.deposit_held as boolean) ?? false,
      fundPayout: (r.fund_payout as number) ?? 0,
      createdAt: r.created_at as string,
      resolvedAt: (r.resolved_at as string | null) ?? null,
      listingTitle: (listing?.title as string) ?? "—",
      securityDeposit: (meta?.security_deposit as number) ?? 0,
      conversationId: (booking?.conversation_id as string | null) ?? null,
    };
  });
}

export async function getAdminClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("*, profiles!claims_host_id_fkey(name), bookings!claims_booking_id_fkey(conversation_id, metadata, listings!bookings_listing_id_fkey(title))")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => {
    const profile = r.profiles as Record<string, unknown> | null;
    const booking = r.bookings as Record<string, unknown> | null;
    const listing = booking?.listings as Record<string, unknown> | null;
    const meta = booking?.metadata as Record<string, unknown> | null;
    return {
      id: r.id as string,
      bookingId: r.booking_id as string,
      hostId: r.host_id as string,
      hostName: (profile?.name as string) ?? "—",
      description: r.description as string,
      damageAmount: r.damage_amount as number,
      photos: (r.photos as string[]) ?? [],
      status: r.status as Claim["status"],
      resolution: (r.resolution as string | null) ?? null,
      depositHeld: (r.deposit_held as boolean) ?? false,
      fundPayout: (r.fund_payout as number) ?? 0,
      createdAt: r.created_at as string,
      resolvedAt: (r.resolved_at as string | null) ?? null,
      listingTitle: (listing?.title as string) ?? "—",
      securityDeposit: (meta?.security_deposit as number) ?? 0,
      conversationId: (booking?.conversation_id as string | null) ?? null,
    };
  });
}

export async function resolveClaim(
  id: string,
  status: "approved" | "rejected",
  resolution: string,
  depositHeld: boolean,
  fundPayout: number
) {
  const { error } = await supabase
    .from("claims")
    .update({
      status,
      resolution,
      deposit_held: depositHeld,
      fund_payout: fundPayout,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  return { error };
}

export async function hasOpenClaim(bookingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("claims")
    .select("id")
    .eq("booking_id", bookingId)
    .in("status", ["open", "approved"])
    .maybeSingle();
  return !!data;
}

// ---- Disputes ----

export interface Dispute {
  id: string;
  bookingId: string;
  reporterId: string;
  reporterRole: string;
  reporterName: string;
  reason: string;
  status: "open" | "in_progress" | "resolved";
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  listingTitle: string;
  conversationId: string | null;
}

export async function createDispute(bookingId: string, reporterId: string, reason: string) {
  // Determine reporter role
  const { data: booking } = await supabase
    .from("bookings")
    .select("renter_id")
    .eq("id", bookingId)
    .single();
  const reporterRole = booking && (booking as Record<string, unknown>).renter_id === reporterId ? "renter" : "host";

  const { data, error } = await supabase
    .from("disputes")
    .insert({
      booking_id: bookingId,
      reporter_id: reporterId,
      reporter_role: reporterRole,
      reason,
    })
    .select()
    .single();
  return { data, error };
}

export async function getAdminDisputes(): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from("disputes")
    .select("*, profiles!disputes_reporter_id_fkey(name), bookings!disputes_booking_id_fkey(conversation_id, listings!bookings_listing_id_fkey(title))")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => {
    const profile = r.profiles as Record<string, unknown> | null;
    const booking = r.bookings as Record<string, unknown> | null;
    const listing = booking?.listings as Record<string, unknown> | null;
    return {
      id: r.id as string,
      bookingId: r.booking_id as string,
      reporterId: r.reporter_id as string,
      reporterRole: r.reporter_role as string,
      reporterName: (profile?.name as string) ?? "—",
      reason: r.reason as string,
      status: r.status as Dispute["status"],
      adminNote: (r.admin_note as string | null) ?? null,
      resolvedAt: (r.resolved_at as string | null) ?? null,
      createdAt: r.created_at as string,
      listingTitle: (listing?.title as string) ?? "—",
      conversationId: (booking?.conversation_id as string | null) ?? null,
    };
  });
}

export async function resolveDispute(id: string, adminNote: string) {
  const { error } = await supabase
    .from("disputes")
    .update({
      status: "resolved",
      admin_note: adminNote,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  return { error };
}

export async function getOpenDisputeCount(): Promise<number> {
  const { count } = await supabase
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  return count ?? 0;
}

// ---- Promo Codes ----

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
}

function rowToPromoCode(r: Record<string, unknown>): PromoCode {
  return {
    id: r.id as string,
    code: r.code as string,
    discountType: r.discount_type as "percent" | "fixed",
    discountValue: r.discount_value as number,
    maxUses: (r.max_uses as number | null) ?? null,
    usedCount: (r.used_count as number) ?? 0,
    validFrom: (r.valid_from as string | null) ?? null,
    validUntil: (r.valid_until as string | null) ?? null,
    active: (r.active as boolean) ?? true,
    createdAt: r.created_at as string,
  };
}

export async function validatePromoCode(code: string): Promise<{
  valid: boolean;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  error?: string;
}> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "Промокод не найден" };
  }

  const row = data as Record<string, unknown>;

  if (!(row.active as boolean)) {
    return { valid: false, error: "Промокод неактивен" };
  }

  const maxUses = row.max_uses as number | null;
  const usedCount = row.used_count as number;
  if (maxUses !== null && usedCount >= maxUses) {
    return { valid: false, error: "Промокод исчерпан" };
  }

  const now = new Date();
  const validFrom = row.valid_from ? new Date(row.valid_from as string) : null;
  const validUntil = row.valid_until ? new Date(row.valid_until as string) : null;

  if (validFrom && now < validFrom) {
    return { valid: false, error: "Промокод ещё не активен" };
  }
  if (validUntil && now > validUntil) {
    return { valid: false, error: "Промокод истёк" };
  }

  return {
    valid: true,
    discountType: row.discount_type as "percent" | "fixed",
    discountValue: row.discount_value as number,
  };
}

export async function incrementPromoCodeUsage(code: string) {
  // Increment used_count by 1
  const { data } = await supabase
    .from("promo_codes")
    .select("id, used_count")
    .eq("code", code.toUpperCase().trim())
    .single();
  if (!data) return;
  const row = data as Record<string, unknown>;
  await supabase
    .from("promo_codes")
    .update({ used_count: (row.used_count as number) + 1 })
    .eq("id", row.id);
}

export async function getAdminPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map(rowToPromoCode);
}

export async function createPromoCode(input: {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}) {
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code: input.code.toUpperCase().trim(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      max_uses: input.maxUses ?? null,
      valid_from: input.validFrom ?? null,
      valid_until: input.validUntil ?? null,
    })
    .select()
    .single();
  return { data, error };
}

export async function togglePromoCode(id: string, active: boolean) {
  const { error } = await supabase
    .from("promo_codes")
    .update({ active })
    .eq("id", id);
  return { error };
}

// ---- Admin: Listing Management ----

export interface AdminListing {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  city: string;
  pricePerHour: number;
  status: string;
  moderationStatus: string;
  moderationNote: string | null;
  hostId: string;
  hostName: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export async function getAdminListings(): Promise<AdminListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, slug, images, city, price_per_hour, status, moderation_status, moderation_note, host_id, rating, review_count, created_at, profiles!listings_host_id_fkey(name)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => {
    const images = r.images as string[] | null;
    const profile = r.profiles as Record<string, unknown> | null;
    return {
      id: r.id as string,
      title: r.title as string,
      slug: r.slug as string,
      image: images?.[0] ?? null,
      city: r.city as string,
      pricePerHour: r.price_per_hour as number,
      status: r.status as string,
      moderationStatus: (r.moderation_status as string) ?? "approved",
      moderationNote: (r.moderation_note as string | null) ?? null,
      hostId: r.host_id as string,
      hostName: (profile?.name as string) ?? "—",
      rating: r.rating as number,
      reviewCount: r.review_count as number,
      createdAt: r.created_at as string,
    };
  });
}

export async function adminUpdateListing(
  listingId: string,
  fields: {
    status?: string;
    moderationStatus?: string;
    moderationNote?: string | null;
  }
) {
  const update: Record<string, unknown> = {};
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.moderationStatus !== undefined) {
    update.moderation_status = fields.moderationStatus;
    update.moderated_at = new Date().toISOString();
  }
  if (fields.moderationNote !== undefined) update.moderation_note = fields.moderationNote;

  const { error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", listingId);
  return { error };
}

// ---- Listing Moderation ----

export async function getPendingListings() {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, slug, images, city, price_per_hour, created_at, host_id, moderation_status, moderation_note, profiles!listings_host_id_fkey(name, email)")
    .eq("moderation_status", "pending_review")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as Array<Record<string, unknown>>;
}

export async function moderateListing(
  listingId: string,
  status: "approved" | "rejected",
  note?: string
) {
  const { error } = await supabase
    .from("listings")
    .update({
      moderation_status: status,
      moderation_note: note ?? null,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", listingId);

  // Email хосту (fire-and-forget)
  if (!error) {
    void (async () => {
      try {
        const { data: listing } = await supabase
          .from("listings")
          .select("title, slug, host_id")
          .eq("id", listingId)
          .single();
        if (!listing) return;
        const row = listing as Record<string, unknown>;
        const hostId = row.host_id as string;
        const title = row.title as string;
        const slug = row.slug as string;

        const host = await getUserEmailName(hostId);
        if (!host?.email) return;

        if (status === "approved") {
          await sendListingApprovedEmail({
            to: host.email,
            hostName: host.name,
            listingTitle: title,
            listingUrl: `${SITE_URL}/listing/${slug}`,
          });
        } else {
          await sendListingRejectedEmail({
            to: host.email,
            hostName: host.name,
            listingTitle: title,
            reason: note,
          });
        }
      } catch (e) {
        console.error("[email] moderation notification failed:", e);
      }
    })();
  }

  return { error };
}

// ---- Profile ----

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, phone, phone_verified, avatar_url, role, email, company_name, company_bin, company_address, iin, created_at, id_verified, bio, instagram, telegram, payout_method, payout_details, payout_holder_name")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function updateProfile(
  userId: string,
  fields: {
    name?: string;
    phone?: string | null;
    avatar_url?: string | null;
    iin?: string | null;
    company_name?: string | null;
    company_bin?: string | null;
    company_address?: string | null;
    bio?: string | null;
    instagram?: string | null;
    telegram?: string | null;
    payout_method?: string | null;
    payout_details?: string | null;
    payout_holder_name?: string | null;
  }
) {
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);
  return { error };
}

