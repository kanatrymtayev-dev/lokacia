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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Каталог локаций</h1>
            <p className="mt-2 text-gray-600">
              Найдите идеальное пространство для вашего проекта
            </p>
          </div>
          <CatalogClient listings={listings} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
