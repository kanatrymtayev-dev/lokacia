import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { initPayment } from "@/lib/paybox";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { bookingId } = (await req.json()) as { bookingId: string };

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  // Get booking
  const { data: booking, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("id, total_price, status, payment_status, commission_rate, renter_id, listings!bookings_listing_id_fkey(title)")
    .eq("id", bookingId)
    .single();

  if (bErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const row = booking as Record<string, unknown>;

  if (row.status !== "confirmed") {
    return NextResponse.json({ error: "Booking must be confirmed to pay" }, { status: 400 });
  }

  if (row.payment_status === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  // Check existing pending/completed payment
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id, status")
    .eq("booking_id", bookingId)
    .in("status", ["pending", "completed"])
    .maybeSingle();

  if (existing) {
    const ex = existing as Record<string, unknown>;
    if (ex.status === "completed") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }
    // Re-init payment for pending
  }

  // Create payment record
  const amount = row.total_price as number;
  const commissionRate = (row.commission_rate as number) ?? 0.15;
  const serviceFee = Math.round(amount * 0.075);
  const baseAmount = amount - serviceFee;
  const commissionAmount = Math.round(baseAmount * commissionRate);
  const hostAmount = baseAmount - commissionAmount;

  let paymentId: string;

  if (existing) {
    paymentId = (existing as Record<string, unknown>).id as string;
  } else {
    const { data: payment, error: pErr } = await supabaseAdmin
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount,
        service_fee: serviceFee,
        commission_amount: commissionAmount,
        host_amount: hostAmount,
        commission_rate: commissionRate,
        method: "paybox",
        status: "pending",
      })
      .select("id")
      .single();

    if (pErr || !payment) {
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }
    paymentId = (payment as Record<string, unknown>).id as string;
  }

  // Get renter info for PayBox
  const { data: renter } = await supabaseAdmin
    .from("profiles")
    .select("phone, email")
    .eq("id", row.renter_id as string)
    .single();

  const listing = row.listings as Record<string, unknown> | null;
  const listingTitle = (listing?.title as string) ?? "Бронирование на LOKACIA.KZ";

  // Init PayBox payment
  const result = await initPayment({
    orderId: paymentId,
    amount,
    description: `Оплата бронирования: ${listingTitle}`,
    userPhone: (renter as Record<string, unknown> | null)?.phone as string | undefined,
    userEmail: (renter as Record<string, unknown> | null)?.email as string | undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Payment init failed" }, { status: 502 });
  }

  // Save PayBox payment ID
  if (result.paymentId) {
    await supabaseAdmin
      .from("payments")
      .update({ kaspi_txn_id: result.paymentId }) // reuse column for paybox payment ID
      .eq("id", paymentId);
  }

  return NextResponse.json({
    paymentId,
    redirectUrl: result.redirectUrl,
    mock: result.mock ?? false,
  });
}
