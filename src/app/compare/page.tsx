"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getListingsByIds } from "@/lib/api";
import type { Listing } from "@/lib/types";
import { CITY_LABELS, SPACE_TYPE_LABELS } from "@/lib/types";
import { formatPrice, formatRating } from "@/lib/utils";

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    }>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (ids.length === 0) { setListings([]); setLoading(false); return; }
    setLoading(true);
    getListingsByIds(ids).then((data) => {
      if (cancelled) return;
      // Сохраняем порядок как в URL
      const order = new Map(ids.map((id, i) => [id, i]));
      data.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      setListings(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  function removeListing(id: string) {
    const newIds = ids.filter((i) => i !== id);
    if (newIds.length === 0) router.push("/catalog");
    else router.replace(`/compare?ids=${newIds.join(",")}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold mb-2">Нечего сравнивать</h1>
            <p className="text-gray-500 mb-6">Выберите минимум 2 локации в каталоге, отметив их кнопкой «Сравнить».</p>
            <Link href="/catalog" className="inline-block bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors">
              Перейти в каталог
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Строки сравнения: метка + функция получения значения
  type Row = { label: string; render: (l: Listing) => React.ReactNode };
  const rows: Row[] = [
    { label: "Город", render: (l) => `${CITY_LABELS[l.city]}, ${l.district}` },
    { label: "Тип помещения", render: (l) => SPACE_TYPE_LABELS[l.spaceType] },
    { label: "Цена / час", render: (l) => <span className="font-bold">{formatPrice(l.pricePerHour)}</span> },
    { label: "Цена / день", render: (l) => l.pricePerDay ? formatPrice(l.pricePerDay) : "—" },
    { label: "Минимум часов", render: (l) => `${l.minHours} ч` },
    { label: "Площадь", render: (l) => `${l.area} м²` },
    { label: "Вместимость", render: (l) => `до ${l.capacity} чел.` },
    { label: "Высота потолков", render: (l) => l.ceilingHeight ? `${l.ceilingHeight} м` : "—" },
    { label: "Рейтинг", render: (l) => l.reviewCount > 0 ? `${formatRating(l.rating)} (${l.reviewCount})` : "Нет отзывов" },
    { label: "Мгновенное бронирование", render: (l) => l.instantBook ? "✓" : "—" },
    { label: "Суперхост", render: (l) => l.superhost ? "✓" : "—" },
    { label: "Алкоголь", render: (l) => l.allows.alcohol ? "✓" : "—" },
    { label: "Громкая музыка", render: (l) => l.allows.loudMusic ? "✓" : "—" },
    { label: "Питомцы", render: (l) => l.allows.pets ? "✓" : "—" },
    { label: "Курение", render: (l) => l.allows.smoking ? "✓" : "—" },
    { label: "Еда", render: (l) => l.allows.food ? "✓" : "—" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Сравнение локаций</h1>
              <p className="mt-1 text-sm text-gray-600">{listings.length} из 3 возможных</p>
            </div>
            <Link href="/catalog" className="text-sm text-primary hover:underline whitespace-nowrap">
              ← В каталог
            </Link>
          </div>

          {/* Sticky horizontal scroll on mobile */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase px-4 py-3 sticky left-0 bg-white z-10 w-40 sm:w-52">
                    Характеристика
                  </th>
                  {listings.map((l) => (
                    <th key={l.id} className="text-left px-4 py-3 align-top">
                      <div className="space-y-2 min-w-[180px]">
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                          {l.images[0] && typeof l.images[0] === 'string' && l.images[0].trim() !== '' ? (
                            <Image src={l.images[0]} alt={l.title} fill className="object-cover" sizes="220px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Нет фото</div>
                          )}
                          <button
                            onClick={() => removeListing(l.id)}
                            aria-label="Убрать из сравнения"
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/95 backdrop-blur text-gray-700 hover:text-red-500 flex items-center justify-center shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <Link href={`/listing/${l.slug}`} className="block font-semibold text-gray-900 line-clamp-2 hover:text-primary text-sm">
                          {l.title}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50/50" : ""}>
                    <td className="text-sm text-gray-500 px-4 py-3 sticky left-0 bg-inherit z-10 w-40 sm:w-52">
                      {row.label}
                    </td>
                    {listings.map((l) => (
                      <td key={l.id} className="text-sm text-gray-800 px-4 py-3 align-top">
                        {row.render(l)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-4 sticky left-0 bg-white z-10"></td>
                  {listings.map((l) => (
                    <td key={l.id} className="px-4 py-4">
                      <Link
                        href={`/listing/${l.slug}`}
                        className="block text-center bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
                      >
                        Открыть
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
