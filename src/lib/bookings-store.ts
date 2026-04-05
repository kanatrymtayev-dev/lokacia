import type { BookingRequest } from "./types";

const STORAGE_KEY = "lokacia_bookings";

// Demo bookings
const DEMO_BOOKINGS: BookingRequest[] = [
  {
    id: "b1",
    listingId: "1",
    renterId: "r1",
    date: "2026-04-10",
    startTime: "10:00",
    endTime: "14:00",
    guestCount: 5,
    activityType: "production",
    description: "Фотосъёмка каталога одежды, команда 5 человек. Нужен доступ к гримёрной.",
    totalPrice: 34400,
    status: "pending",
    createdAt: "2026-04-05",
  },
  {
    id: "b2",
    listingId: "1",
    renterId: "r1",
    date: "2026-04-08",
    startTime: "09:00",
    endTime: "13:00",
    guestCount: 3,
    activityType: "production",
    description: "Портретная съёмка для журнала.",
    totalPrice: 34400,
    status: "confirmed",
    createdAt: "2026-04-03",
  },
  {
    id: "b3",
    listingId: "2",
    renterId: "r1",
    date: "2026-04-15",
    startTime: "18:00",
    endTime: "23:00",
    guestCount: 100,
    activityType: "event",
    description: "Корпоратив IT-компании на 100 человек. Нужен звук, свет, проектор.",
    totalPrice: 134375,
    status: "pending",
    createdAt: "2026-04-04",
  },
];

export function getBookings(): BookingRequest[] {
  if (typeof window === "undefined") return DEMO_BOOKINGS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_BOOKINGS));
    return DEMO_BOOKINGS;
  }
  return JSON.parse(stored);
}

export function addBooking(booking: Omit<BookingRequest, "id" | "createdAt">): BookingRequest {
  const all = getBookings();
  const newBooking: BookingRequest = {
    ...booking,
    id: `b_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  all.push(newBooking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newBooking;
}

export function updateBookingStatus(id: string, status: BookingRequest["status"]) {
  const all = getBookings();
  const idx = all.findIndex((b) => b.id === id);
  if (idx !== -1) {
    all[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return all;
}

export function getBookingsByListingIds(listingIds: string[]): BookingRequest[] {
  return getBookings().filter((b) => listingIds.includes(b.listingId));
}

export function getBookingsByRenter(renterId: string): BookingRequest[] {
  return getBookings().filter((b) => b.renterId === renterId);
}
