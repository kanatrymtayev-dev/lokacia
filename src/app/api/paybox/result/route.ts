import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySignature } from "@/lib/paybox";

export const runtime = "nodejs";

/**
 * PayBox server-to-server callback.
 * Called after payment is processed (success or failure).
 * Must respond with XML.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  console.log("[paybox/result] callback:", JSON.stringify(params));

  // Verify signature (skip for mock)
  const isMock = params.pg_order_id?.startsWith("mock_") || !process.env.PAYBOX_SECRET_KEY;
  if (!isMock && !verifySignature("result", params)) {
    console.error("[paybox/result] invalid signature");
    return new NextResponse(
      `<?xml version="1.0" encoding="utf-8"?><response><pg_status>error</pg_status><pg_description>Invalid signature</pg_description></response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  const orderId = params.pg_order_id; // our payment ID
  const pgResult = params.pg_result; // "1" = success, "0" = failure

  if (!orderId) {
    return new NextResponse(
      `<?xml version="1.0" encoding="utf-8"?><response><pg_status>error</pg_status><pg_description>Missing order_id</pg_description></response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  if (pgResult === "1") {
    // Payment successful
    const { error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        kaspi_txn_id: params.pg_payment_id ?? null,
      })
      .eq("id", orderId);

    if (!error) {
      // Update booking payment_status
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("booking_id")
        .eq("id", orderId)
        .single();

      if (payment) {
        await supabaseAdmin
          .from("bookings")
          .update({ payment_status: "paid" })
          .eq("id", (payment as Record<string, unknown>).booking_id);
      }
    }

    console.log("[paybox/result] payment completed:", orderId);
  } else {
    // Payment failed
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed" })
      .eq("id", orderId);

    console.log("[paybox/result] payment failed:", orderId);
  }

  return new NextResponse(
    `<?xml version="1.0" encoding="utf-8"?><response><pg_status>ok</pg_status></response>`,
    { headers: { "Content-Type": "application/xml" } }
  );
}
