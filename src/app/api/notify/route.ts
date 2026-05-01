import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendBookingPendingEmail,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
  sendNewMessageEmail,
} from "@/lib/email";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lokacia.kz";

async function getUser(id: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("name, email, email_notifications")
    .eq("id", id)
    .single();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    name: (row.name as string) ?? "Пользователь",
    email: (row.email as string | null) ?? null,
    emailNotifications: (row.email_notifications as boolean) ?? true,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token);
    if (!authUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body as { type: string };

    if (type === "booking_pending") {
      const { hostId, listingTitle, date, startTime, endTime, guestName, totalPrice } = body;
      const host = await getUser(hostId);
      if (!host?.email || !host.emailNotifications) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const result = await sendBookingPendingEmail({
        to: host.email,
        hostName: host.name,
        listingTitle,
        date,
        startTime,
        endTime,
        guestName,
        totalPrice,
        dashboardUrl: `${SITE}/dashboard`,
      });
      return NextResponse.json(result);
    }

    if (type === "booking_confirmed") {
      const { renterId, listingTitle, date, startTime, endTime, hostName, listingSlug } = body;
      const renter = await getUser(renterId);
      if (!renter?.email || !renter.emailNotifications) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const result = await sendBookingConfirmedEmail({
        to: renter.email,
        renterName: renter.name,
        listingTitle,
        date,
        startTime,
        endTime,
        hostName,
        listingUrl: `${SITE}/listing/${listingSlug}`,
      });
      return NextResponse.json(result);
    }

    if (type === "booking_rejected") {
      const { renterId, listingTitle, hostName } = body;
      const renter = await getUser(renterId);
      if (!renter?.email || !renter.emailNotifications) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const result = await sendBookingRejectedEmail({
        to: renter.email,
        renterName: renter.name,
        listingTitle,
        hostName,
      });
      return NextResponse.json(result);
    }

    if (type === "new_message") {
      const { recipientId, senderName, listingTitle, snippet, conversationId } = body;
      const recipient = await getUser(recipientId);
      if (!recipient?.email || !recipient.emailNotifications) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const result = await sendNewMessageEmail({
        to: recipient.email,
        recipientName: recipient.name,
        senderName,
        listingTitle,
        snippet,
        inboxUrl: `${SITE}/inbox`,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (e) {
    console.error("[notify] error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
