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
      lat: 0,
      lng: 0,
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

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();

  return { data, error };
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
    .select("id, conversation_id, sender_id, content, is_read, created_at")
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
