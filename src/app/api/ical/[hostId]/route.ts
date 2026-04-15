import { NextResponse } from "next/server";
import { getHostBookings, getHostBlackouts } from "@/lib/api";

// iCal RFC 5545: https://www.rfc-editor.org/rfc/rfc5545

function pad(n: number) { return String(n).padStart(2, "0"); }

function toICalDateTime(date: string, time: string): string {
  // date: "YYYY-MM-DD", time: "HH:MM" → "YYYYMMDDTHHMMSS" (floating local time)
  const [y, m, d] = date.split("-");
  const [h, min] = time.split(":");
  return `${y}${m}${d}T${pad(Number(h))}${pad(Number(min))}00`;
}

function toICalDate(date: string): string {
  return date.replace(/-/g, "");
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function nowStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

// Add 1 day to YYYY-MM-DD (для DTEND allday — exclusive)
function addDay(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hostId: string }> }
) {
  const { hostId } = await params;

  const [bookings, blackouts] = await Promise.all([
    getHostBookings(hostId),
    getHostBlackouts(hostId),
  ]);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lokacia//Bookings//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Lokacia · Бронирования",
    "X-WR-TIMEZONE:Asia/Almaty",
  ];

  const stamp = nowStamp();

  // Бронирования: только confirmed/completed
  for (const raw of bookings as Array<Record<string, unknown>>) {
    const status = raw.status as string;
    if (status !== "confirmed" && status !== "completed") continue;
    const id = raw.id as string;
    const date = raw.date as string;
    const start = raw.start_time as string;
    const end = raw.end_time as string;
    const listing = raw.listings as Record<string, unknown> | null;
    const title = (listing?.title as string) ?? "Бронь";
    const guests = raw.guest_count as number;

    lines.push(
      "BEGIN:VEVENT",
      `UID:booking-${id}@lokacia.kz`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Almaty:${toICalDateTime(date, start)}`,
      `DTEND;TZID=Asia/Almaty:${toICalDateTime(date, end)}`,
      `SUMMARY:${escapeText(`Бронь · ${title}`)}`,
      `DESCRIPTION:${escapeText(`Гостей: ${guests}`)}`,
      `STATUS:${status === "completed" ? "CONFIRMED" : "CONFIRMED"}`,
      "END:VEVENT"
    );
  }

  // Блокировки: allday-events
  for (const b of blackouts) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:blackout-${b.id}@lokacia.kz`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toICalDate(b.startDate)}`,
      `DTEND;VALUE=DATE:${addDay(b.endDate)}`, // exclusive
      `SUMMARY:${escapeText(`Недоступно · ${b.listingTitle}`)}`,
      ...(b.reason ? [`DESCRIPTION:${escapeText(b.reason)}`] : []),
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="lokacia-${hostId}.ics"`,
    },
  });
}
