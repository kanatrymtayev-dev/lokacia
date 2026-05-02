import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getListings, getListingBySlug, getReviewsByListingId } from "@/lib/api";
import { CITY_LABELS } from "@/lib/types";
import ListingContent from "./listing-content";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const listings = await getListings();
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Не найдено — LOKACIA.KZ" };
  const ogImage = listing.images?.[0] ?? null;
  return {
    title: `${listing.title} — LOKACIA.KZ`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      type: "website",
      locale: "ru_KZ",
      siteName: "LOKACIA.KZ",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: listing.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: listing.description.slice(0, 160),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const reviews = await getReviewsByListingId(listing.id);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ListingContent listing={listing} reviews={reviews} />
      <Footer />
    </div>
  );
}
