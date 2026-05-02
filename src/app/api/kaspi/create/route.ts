import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const KASPI_MOCK = process.env.KASPI_MOCK === "true" || !process.env.KASPI_MERCHANT_ID;

export async function POST(req: NextRequest) {
  const { bookingId } = (await req.json()) as { bookingId: string };
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  // Get booking
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .select("id, total_price, status, payment_status, commission_rate")
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

  // Check existing pending payment
  const { data: existing } = await supabase
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
    return NextResponse.json({ paymentId: ex.id, mock: KASPI_MOCK });
  }

  // Create payment using existing schema
  const amount = row.total_price as number;
  const commissionRate = (row.commission_rate as number) ?? 0;
  const serviceFee = 0;
  const baseAmount = amount;
  const commissionAmount = Math.round(baseAmount * commissionRate);
  const hostAmount = baseAmount - commissionAmount;

  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .insert({
      booking_id: bookingId,
      amount,
      service_fee: serviceFee,
      commission_amount: commissionAmount,
      host_amount: hostAmount,
      commission_rate: commissionRate,
      method: "kaspi_pay",
      status: "pending",
    })
    .select("id")
    .single();

  if (pErr || !payment) {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }

  if (KASPI_MOCK) {
    return NextResponse.json({
      paymentId: (payment as Record<string, unknown>).id,
      mock: true,
    });
  }

  // Real Kaspi Pay integration (placeholder)
  // TODO: call Kaspi Business API with KASPI_MERCHANT_ID, KASPI_CLIENT_ID, KASPI_CLIENT_SECRET
  return NextResponse.json({ error: "Kaspi Pay not yet configured" }, { status: 501 });
}
