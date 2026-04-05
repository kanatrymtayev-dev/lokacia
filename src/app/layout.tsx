import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "LOKACIA.KZ — Маркетплейс аренды локаций в Казахстане",
  description:
    "Найдите идеальное пространство для съёмок, мероприятий и встреч. Или сдайте своё помещение и зарабатывайте.",
  keywords: [
    "аренда локаций",
    "фотостудия Алматы",
    "площадка для мероприятий",
    "аренда студии для съёмок",
    "ивент площадка Астана",
    "sound stage Казахстан",
  ],
  openGraph: {
    title: "LOKACIA.KZ — Маркетплейс аренды локаций",
    description:
      "Найдите идеальное пространство для съёмок, мероприятий и встреч в Казахстане.",
    locale: "ru_KZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
