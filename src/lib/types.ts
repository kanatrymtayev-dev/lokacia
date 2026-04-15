export type ActivityType = "production" | "event" | "meeting" | "leisure";

export type SpaceType =
  | "photo_studio"
  | "video_studio"
  | "sound_stage"
  | "apartment"
  | "house"
  | "villa"
  | "restaurant"
  | "cafe"
  | "bar"
  | "office"
  | "coworking"
  | "banquet_hall"
  | "loft"
  | "warehouse"
  | "yurt"
  | "ethno"
  | "chalet"
  | "outdoor"
  | "pool"
  | "gym"
  | "other";

export type Style =
  | "modern"
  | "industrial"
  | "classic"
  | "minimalist"
  | "ethno"
  | "vintage"
  | "loft"
  | "rustic";

export type City = "almaty" | "astana" | "shymkent" | "karaganda";

export interface Favorite {
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface PricingTier {
  max_guests: number;
  price_per_hour: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  charge_type: "flat" | "per_hour";
}

export interface BookingMetadata {
  base_price?: number;
  selected_tier?: PricingTier | null;
  selected_add_ons?: string[];
  add_ons_snapshot?: Array<{ id: string; name: string; price: number; charge_type: "flat" | "per_hour"; total: number }>;
  [key: string]: unknown;
}

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  spaceType: SpaceType;
  activityTypes: ActivityType[];
  city: City;
  district: string;
  address: string;
  lat: number;
  lng: number;
  area: number; // m²
  capacity: number;
  ceilingHeight?: number; // meters
  pricePerHour: number; // KZT
  pricePerDay?: number;
  minHours: number;
  images: string[];
  styles: Style[];
  amenities: string[];
  rules: string[];
  allows: {
    alcohol: boolean;
    loudMusic: boolean;
    pets: boolean;
    smoking: boolean;
    food: boolean;
  };
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostPhone: string;
  rating: number;
  reviewCount: number;
  instantBook: boolean;
  superhost: boolean;
  pricingTiers?: PricingTier[];
  addOns?: AddOn[];
  featuredUntil?: string | null;
  createdAt: string;
}

export interface ListingView {
  id: string;
  listingId: string;
  viewerId: string | null;
  viewedAt: string;
}

export interface WeekStat {
  weekStart: string;
  value: number;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "completed"
  | "cancelled";

export interface BookingRequest {
  id: string;
  listingId: string;
  renterId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  activityType: ActivityType;
  description: string;
  totalPrice: number;
  status: BookingStatus;
  conversationId?: string | null;
  createdAt: string;
}

export type MessageType = "text" | "system" | "quote";

export interface QuoteMetadata {
  price: number;
  hours: number;
  valid_until?: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ListingBlackout {
  id: string;
  listingId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

export interface HostBlackout extends ListingBlackout {
  listingTitle: string;
  listingSlug: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  type: MessageType;
  bookingId?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string | null;
  guestId: string;
  hostId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostProfile {
  id: string;
  name: string;
  phone: string | null;
  role: "host" | "renter";
  avatarUrl: string | null;
  responseRate: number | null;
  responseTime: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  bookingId?: string | null;
  targetType?: "listing" | "guest";
  targetUserId?: string | null;
  authorName: string;
  authorAvatar: string;
  rating: number;
  text: string;
  createdAt: string;
}

export const CITY_LABELS: Record<City, string> = {
  almaty: "Алматы",
  astana: "Астана",
  shymkent: "Шымкент",
  karaganda: "Караганда",
};

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  photo_studio: "Фотостудия",
  video_studio: "Видеостудия",
  sound_stage: "Sound Stage",
  apartment: "Квартира",
  house: "Дом",
  villa: "Вилла",
  restaurant: "Ресторан",
  cafe: "Кафе",
  bar: "Бар",
  office: "Офис",
  coworking: "Коворкинг",
  banquet_hall: "Банкетный зал",
  loft: "Лофт",
  warehouse: "Склад",
  yurt: "Юрта",
  ethno: "Этно-пространство",
  chalet: "Горное шале",
  outdoor: "Open-air",
  pool: "Бассейн",
  gym: "Спортзал",
  other: "Другое",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  production: "Продакшн",
  event: "Мероприятие",
  meeting: "Встреча",
  leisure: "Отдых",
};

export const STYLE_LABELS: Record<Style, string> = {
  modern: "Современный",
  industrial: "Индустриальный",
  classic: "Классический",
  minimalist: "Минимализм",
  ethno: "Этно",
  vintage: "Винтаж",
  loft: "Лофт",
  rustic: "Рустик",
};
