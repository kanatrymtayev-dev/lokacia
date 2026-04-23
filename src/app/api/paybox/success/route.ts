import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * PayBox success redirect — user lands here after successful payment.
 * For mock mode, also marks payment as completed.
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("pg_order_id");
  const isMock = req.nextUrl.searchParams.get("mock") === "1";

  // In mock mode, simulate the result callback
  if (isMock && orderId) {
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, status, booking_id")
      .eq("id", orderId)
      .single();

    if (payment && (payment as Record<string, unknown>).status === "pending") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "completed", paid_at: new Date().toISOString() })
        .eq("id", orderId);

      await supabaseAdmin
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", (payment as Record<string, unknown>).booking_id);
    }
  }

  // Redirect to bookings page with success message
  return NextResponse.redirect(new URL("/bookings?payment=success", req.url));
}
