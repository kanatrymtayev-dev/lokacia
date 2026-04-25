import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPaymentProvider } from "@/lib/payment-providers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id, provider } = body as {
      payment_id: string;
      provider: string;
    };

    if (!payment_id) {
      return NextResponse.json({ error: "payment_id required" }, { status: 400 });
    }

    return await processPayment(payment_id, provider || "mock");
  } catch (err) {
    console.error("[payments/callback] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// Also handle GET for mock provider redirects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("id");
    const provider = searchParams.get("provider") || "mock";

    if (!paymentId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    return await processPayment(paymentId, provider);
  } catch (err) {
    console.error("[payments/callback GET] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function processPayment(paymentId: string, providerName: string) {
  const admin = getSupabaseAdmin();

  // 1. Find booking by payment_id
  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, payment_id, payment_status, renter_id, listing_id, total_price, date, start_time, end_time")
    .eq("payment_id", paymentId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found for payment" }, { status: 404 });
  }

  const b = booking as Record<string, unknown>;

  // Already paid — idempotent
  if (b.payment_status === "paid") {
    return NextResponse.json({ ok: true, already_paid: true });
  }

  // 2. Verify with provider
  const provider = getPaymentProvider(providerName);
  const { paid } = await provider.verifyPayment(paymentId);

  if (!paid) {
    return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
  }

  // 3. Update booking
  const { error: updateError } = await admin
    .from("bookings")
    .update({
      payment_status: "paid",
      payment_charged_at: new Date().toISOString(),
    })
    .eq("id", b.id as string);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 4. Send email notifications (fire-and-forget)
  void (async () => {
    try {
      const bookingId = b.id as string;
      const listingId = b.listing_id as string;
      const renterId = b.renter_id as string;

      const [listingRes, renterRes] = await Promise.all([
        admin.from("listings").select("title, slug, host_id").eq("id", listingId).single(),
        admin.from("profiles").select("name, email").eq("id", renterId).single(),
      ]);

      if (!listingRes.data || !renterRes.data) return;

      const listing = listingRes.data as Record<string, unknown>;
      const renter = renterRes.data as Record<string, unknown>;
      const hostId = listing.host_id as string;

      const hostRes = await admin.from("profiles").select("name, email").eq("id", hostId).single();
      if (!hostRes.data) return;
      const host = hostRes.data as Record<string, unknown>;

      // Dynamic import to avoid build issues
      const { sendBookingConfirmedEmail } = await import("@/lib/email");

      // Email to renter
      if (renter.email) {
        await sendBookingConfirmedEmail({
          to: renter.email as string,
          renterName: renter.name as string,
          listingTitle: listing.title as string,
          date: b.date as string,
          startTime: b.start_time as string,
          endTime: b.end_time as string,
          hostName: host.name as string,
          listingUrl: `https://lokacia.kz/listing/${listing.slug as string}`,
        });
      }

      // System message in chat
      const convoRes = await admin
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("guest_id", renterId)
        .single();

      if (convoRes.data) {
        await admin.from("messages").insert({
          conversation_id: (convoRes.data as Record<string, unknown>).id,
          sender_id: renterId,
          content: `Оплата подтверждена · ${(b.total_price as number).toLocaleString("ru-RU")} ₸`,
          type: "system",
          metadata: { type: "payment_confirmed", bookingId },
        });
      }
    } catch (e) {
      console.error("[payments/callback] email/chat notification failed:", e);
    }
  })();

  return NextResponse.json({ ok: true });
}
