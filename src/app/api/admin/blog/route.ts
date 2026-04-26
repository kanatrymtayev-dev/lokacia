import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// Cyrillic → Latin transliteration for slug
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya", і: "i", ү: "u", ұ: "u", қ: "k", ғ: "g", ә: "a", ө: "o",
  ң: "n", һ: "h",
};

function slugify(text: string): string {
  const lower = text.toLowerCase();
  let result = "";
  for (const ch of lower) {
    result += TRANSLIT[ch] ?? ch;
  }
  return result
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function verifyAdmin(request: Request) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
      cookieOptions: { secure: isProduction, sameSite: "lax" as const, path: "/" },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile || !(profile as Record<string, unknown>).is_admin) return null;
  return user;
}

// POST — create blog post
export async function POST(request: Request) {
  try {
    const rl = rateLimit(getClientIP(request), "admin-blog", { limit: 30, windowMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const { title, excerpt, content, coverImage, status, seoTitle, seoDescription } = body as {
      title: string;
      excerpt?: string;
      content: string;
      coverImage?: string;
      status: "draft" | "published";
      seoTitle?: string;
      seoDescription?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    // Generate unique slug
    let slug = body.slug?.trim() || slugify(title);
    const admin = getSupabaseAdmin();

    // Check uniqueness, append random suffix if needed
    const { data: existing } = await admin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      slug += "-" + Math.random().toString(36).slice(2, 6);
    }

    const { data, error } = await admin
      .from("blog_posts")
      .insert({
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content: content || "",
        cover_image: coverImage || null,
        status,
        author_id: user.id,
        published_at: status === "published" ? new Date().toISOString() : null,
        seo_title: seoTitle?.trim() || null,
        seo_description: seoDescription?.trim() || null,
      })
      .select("id, slug")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: (data as Record<string, unknown>).id, slug: (data as Record<string, unknown>).slug });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH — update blog post
export async function PATCH(request: Request) {
  try {
    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const { id, ...fields } = body as {
      id: string;
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      coverImage?: string;
      status?: "draft" | "published";
      seoTitle?: string;
      seoDescription?: string;
    };

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fields.title !== undefined) update.title = fields.title.trim();
    if (fields.slug !== undefined) update.slug = fields.slug.trim();
    if (fields.excerpt !== undefined) update.excerpt = fields.excerpt.trim() || null;
    if (fields.content !== undefined) update.content = fields.content;
    if (fields.coverImage !== undefined) update.cover_image = fields.coverImage || null;
    if (fields.seoTitle !== undefined) update.seo_title = fields.seoTitle.trim() || null;
    if (fields.seoDescription !== undefined) update.seo_description = fields.seoDescription.trim() || null;

    if (fields.status !== undefined) {
      update.status = fields.status;
      if (fields.status === "published") {
        // Only set published_at if not already set
        const admin = getSupabaseAdmin();
        const { data: current } = await admin
          .from("blog_posts")
          .select("published_at")
          .eq("id", id)
          .single();
        if (current && !(current as Record<string, unknown>).published_at) {
          update.published_at = new Date().toISOString();
        }
      }
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("blog_posts")
      .update(update)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE — delete blog post
export async function DELETE(request: Request) {
  try {
    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json();
    const { id } = body as { id: string };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Delete cover image from storage if exists
    const admin = getSupabaseAdmin();
    const { data: post } = await admin
      .from("blog_posts")
      .select("cover_image")
      .eq("id", id)
      .single();

    if (post && (post as Record<string, unknown>).cover_image) {
      const url = (post as Record<string, unknown>).cover_image as string;
      const match = url.match(/blog\/(.+)$/);
      if (match) {
        await admin.storage.from("blog").remove([match[1]]);
      }
    }

    const { error } = await admin
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
