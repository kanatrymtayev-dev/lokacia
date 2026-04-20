import type { MetadataRoute } from "next";
import { createBrowserClient } from "@supabase/ssr";

const SITE_URL = "https://lokacia.kz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/for-hosts`, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic: listings
  const { data: listings } = await supabase
    .from("listings")
    .select("slug, updated_at")
    .eq("status", "active");

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${SITE_URL}/listing/${(l as Record<string, unknown>).slug}`,
    lastModified: new Date((l as Record<string, unknown>).updated_at as string),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: host profiles
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, updated_at")
    .eq("role", "host");

  const hostPages: MetadataRoute.Sitemap = (hosts ?? []).map((h) => ({
    url: `${SITE_URL}/host/${(h as Record<string, unknown>).id}`,
    lastModified: new Date(((h as Record<string, unknown>).updated_at as string) ?? Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...listingPages, ...hostPages];
}
