import type { Metadata } from "next";
import { Space_Grotesk, Caveat } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
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
  manifest: "/manifest.json",
  themeColor: "#6d28d9",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml", sizes: "192x192" },
    ],
  },
  verification: {
    google: "A1DAMxzoxWmkWRPIf1Vef3SmiZsnbNyFJgRpJluFSXI",
    yandex: "b9925b9843e89b0c",
  },
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
    <html lang="ru" className={`${spaceGrotesk.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </body>
    </html>
  );
}
