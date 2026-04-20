import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    paymentId?: string;
    status?: string;
    kaspiTxnId?: string;
  };

  if (!body.paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, booking_id, status")
    .eq("id", body.paymentId)
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const row = payment as Record<string, unknown>;

  if (row.status === "completed") {
    return NextResponse.json({ ok: true, message: "Already paid" });
  }

  const newStatus = body.status === "failed" ? "failed" : "completed";

  // Update payment
  await supabase
    .from("payments")
    .update({
      status: newStatus,
      paid_at: newStatus === "completed" ? new Date().toISOString() : null,
      kaspi_txn_id: body.kaspiTxnId ?? null,
    })
    .eq("id", row.id);

  // Update booking payment_status
  if (newStatus === "completed") {
    await supabase
      .from("bookings")
      .update({ payment_status: "paid" })
      .eq("id", row.booking_id);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
