import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CatalogClient from "./catalog-client";
import { getListings } from "@/lib/api";

export const metadata: Metadata = {
  title: "Каталог локаций — LOKACIA.KZ",
  description:
    "Найдите идеальное пространство для съёмок, мероприятий и встреч в Алматы, Астане и других городах Казахстана.",
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function CatalogPage() {
  const listings = await getListings();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <CatalogClient listings={listings} />
      </main>
      <Footer />
    </div>
  );
}
