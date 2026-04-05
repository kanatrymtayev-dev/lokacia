import { supabase } from "./supabase";
import { listings as mockListings, reviews as mockReviews } from "./mock-data";
import type { Listing, Review } from "./types";

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
}) {
  const { error } = await supabase.from("bookings").insert({
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
  });

  return { error };
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

export async function updateBookingStatus(bookingId: string, status: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  return { error };
}
