import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request) {
  // 1. Auth check — get current user from session
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
        setAll() {
          // Read-only in route handler
        },
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
  const { data: profile } = await supabase
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
  const admin = getSupabaseAdmin();
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

  return NextResponse.json({ ok: true });
}
