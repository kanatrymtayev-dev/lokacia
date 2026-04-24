import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendListingApprovedEmail, sendListingRejectedEmail } from "@/lib/email";

const SITE_URL = "https://lokacia.kz";

export async function PATCH(request: Request) {
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

  // 2. Admin check
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !(profile as Record<string, unknown>).is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // 3. Parse body
  const body = await request.json();
  const { listingId, status, moderationStatus, moderationNote } = body as {
    listingId: string;
    status?: string;
    moderationStatus?: string;
    moderationNote?: string | null;
  };

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  // 4. Update via service_role (bypasses RLS)
  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (moderationStatus !== undefined) {
    update.moderation_status = moderationStatus;
    update.moderated_at = new Date().toISOString();
  }
  if (moderationNote !== undefined) update.moderation_note = moderationNote;

  const { error } = await admin
    .from("listings")
    .update(update)
    .eq("id", listingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Send email notification (fire-and-forget)
  if (moderationStatus === "approved" || moderationStatus === "rejected") {
    void (async () => {
      try {
        const { data: listing } = await admin
          .from("listings")
          .select("title, slug, host_id")
          .eq("id", listingId)
          .single();
        if (!listing) return;
        const row = listing as Record<string, unknown>;

        const { data: hostProfile } = await admin
          .from("profiles")
          .select("name, email")
          .eq("id", row.host_id as string)
          .single();
        if (!hostProfile) return;
        const host = hostProfile as { name: string; email: string | null };
        if (!host.email) return;

        if (moderationStatus === "approved") {
          await sendListingApprovedEmail({
            to: host.email,
            hostName: host.name,
            listingTitle: row.title as string,
            listingUrl: `${SITE_URL}/listing/${row.slug as string}`,
          });
        } else {
          await sendListingRejectedEmail({
            to: host.email,
            hostName: host.name,
            listingTitle: row.title as string,
            reason: moderationNote ?? undefined,
          });
        }
      } catch (e) {
        console.error("[email] moderation notification failed:", e);
      }
    })();
  }

  return NextResponse.json({ ok: true });
}
