import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getInvoiceDataForBooking } from "@/lib/api";
import { generateInvoicePdf, invoiceNumber } from "@/lib/invoice-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  // Auth-проверка через cookies (текущий пользователь)
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return new NextResponse("Требуется авторизация", { status: 401 });
  }

  // Проверяем что booking существует, статус подходит, и юзер — хост или арендатор
  const { data: booking } = await sb
    .from("bookings")
    .select("renter_id, status, listings!bookings_listing_id_fkey(host_id)")
    .eq("id", bookingId)
    .single();

  if (!booking) return new NextResponse("Бронь не найдена", { status: 404 });

  const b = booking as Record<string, unknown>;
  const status = b.status as string;
  if (status !== "confirmed" && status !== "completed") {
    return new NextResponse("Инвойс доступен после подтверждения брони хостом", { status: 403 });
  }

  const renterId = b.renter_id as string;
  const listing = b.listings as Record<string, unknown> | null;
  const hostId = (listing?.host_id as string) ?? "";
  if (user.id !== renterId && user.id !== hostId) {
    return new NextResponse("Доступ запрещён", { status: 403 });
  }

  const data = await getInvoiceDataForBooking(bookingId);
  if (!data) return new NextResponse("Не удалось собрать данные инвойса", { status: 500 });

  const pdfBytes = await generateInvoicePdf(data);
  const filename = `invoice-${invoiceNumber(bookingId)}.pdf`;

  return new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
