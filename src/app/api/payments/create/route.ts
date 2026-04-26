import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPaymentProvider } from "@/lib/payment-providers";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { createPaymentSchema, validate } from "@/lib/validation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lokacia.kz";

export async function POST(request: Request) {
  try {
    // Rate limit: 10 payment requests per minute per IP
    const ip = getClientIP(request);
    const rl = rateLimit(ip, "payments-create", { limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
    }

    // 1. Auth check
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
        cookieOptions: {
          secure: isProduction,
          sameSite: "lax" as const,
          path: "/",
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Parse & validate body
    const body = await request.json();
    const parsed = validate(createPaymentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { bookingId, provider } = parsed.data;

    if (!bookingId || !provider) {
      return NextResponse.json(
        { error: "bookingId and provider required" },
        { status: 400 }
      );
    }

    // 3. Get booking and validate
    const admin = getSupabaseAdmin();
    const { data: booking, error: fetchError } = await admin
      .from("bookings")
      .select("id, renter_id, total_price, status, payment_status")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 });
    }

    const b = booking as Record<string, unknown>;

    if (b.renter_id !== user.id) {
      return NextResponse.json({ error: "Это не ваше бронирование" }, { status: 403 });
    }

    if (b.status !== "confirmed") {
      return NextResponse.json(
        { error: "Бронирование должно быть подтверждено хостом" },
        { status: 400 }
      );
    }

    if (b.payment_status === "paid") {
      return NextResponse.json({ error: "Уже оплачено" }, { status: 400 });
    }

    // 4. Create payment
    const amount = b.total_price as number;
    const paymentProvider = getPaymentProvider(provider);

    const result = await paymentProvider.createPayment({
      amount,
      orderId: bookingId,
      description: "Бронирование локации на LOKACIA.KZ",
      returnUrl: `${SITE_URL}/bookings?paid=${bookingId}`,
      callbackUrl: `${SITE_URL}/api/payments/callback`,
    });

    // 5. Save payment info to booking
    await admin
      .from("bookings")
      .update({
        payment_provider: provider,
        payment_id: result.paymentId,
      })
      .eq("id", bookingId);

    return NextResponse.json({ paymentUrl: result.paymentUrl });
  } catch (err) {
    console.error("[payments/create] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
