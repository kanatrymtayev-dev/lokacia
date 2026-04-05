"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { SPACE_TYPE_LABELS, ACTIVITY_TYPE_LABELS, CITY_LABELS, STYLE_LABELS } from "@/lib/types";
import type { SpaceType, ActivityType, City, Style } from "@/lib/types";

const spaceTypes = Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][];
const activityTypes = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][];
const cities = Object.entries(CITY_LABELS) as [City, string][];
const styles = Object.entries(STYLE_LABELS) as [Style, string][];

const AMENITY_OPTIONS = [
  "Wi-Fi", "Парковка", "Кондиционер", "Кухня", "Гримёрная",
  "Естественный свет", "Звукоизоляция", "Проектор", "Сцена",
  "Генератор", "Зелёный экран", "Циклорама", "LED-панели",
  "Бар", "Терраса", "Камин", "Танцпол",
];

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [spaceType, setSpaceType] = useState<SpaceType>("photo_studio");
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>(["production"]);
  const [city, setCity] = useState<City>("almaty");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState(50);
  const [capacity, setCapacity] = useState(10);
  const [ceilingHeight, setCeilingHeight] = useState(3);
  const [pricePerHour, setPricePerHour] = useState(10000);
  const [pricePerDay, setPricePerDay] = useState(0);
  const [minHours, setMinHours] = useState(2);
  const [selectedStyles, setSelectedStyles] = useState<Style[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [allows, setAllows] = useState({
    alcohol: false, loudMusic: false, pets: false, smoking: false, food: true,
  });
  const [rules, setRules] = useState("");

  function toggleInArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const listingData = {
      title, description, spaceType, activityTypes: selectedActivities,
      city, district, address, area, capacity, ceilingHeight,
      pricePerHour, pricePerDay: pricePerDay || undefined,
      minHours, styles: selectedStyles, amenities: selectedAmenities,
      allows, rules: rules.split("\n").filter(Boolean),
      hostId: user?.id,
    };
    console.log("New listing:", listingData);
    setSubmitted(true);
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold">Локация добавлена!</h2>
            <p className="mt-2 text-gray-600">
              Ваша локация будет опубликована после проверки модератором (обычно до 24 часов).
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors"
              >
                В панель хоста
              </button>
              <button
                onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); }}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Добавить ещё
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-2">Добавить локацию</h1>
          <p className="text-gray-600 mb-8">Заполните информацию о вашем помещении</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic info */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Основная информация</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Daylight Studio — Циклорама 6м"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите подробно: что есть в помещении, для чего подходит, что делает его уникальным..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип помещения *</label>
                  <select value={spaceType} onChange={(e) => setSpaceType(e.target.value as SpaceType)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white">
                    {spaceTypes.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Город *</label>
                  <select value={city} onChange={(e) => setCity(e.target.value as City)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white">
                    {cities.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Район *</label>
                  <input type="text" required value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Медеуский" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес *</label>
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ул. Панфилова 78" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подходит для *</label>
                <div className="flex flex-wrap gap-2">
                  {activityTypes.map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedActivities(toggleInArray(selectedActivities, v))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedActivities.includes(v)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Space details */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Параметры помещения</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Площадь (м²)</label>
                  <input type="number" min={1} value={area} onChange={(e) => setArea(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Вместимость</label>
                  <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Потолки (м)</label>
                  <input type="number" min={1} step={0.5} value={ceilingHeight} onChange={(e) => setCeilingHeight(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Мин. часов</label>
                  <input type="number" min={1} max={24} value={minHours} onChange={(e) => setMinHours(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                </div>
              </div>

              {/* Styles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Стиль</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedStyles(toggleInArray(selectedStyles, v))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        selectedStyles.includes(v)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Стоимость</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена за час (₸) *</label>
                  <input type="number" required min={1000} step={500} value={pricePerHour} onChange={(e) => setPricePerHour(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена за день (₸)</label>
                  <input type="number" min={0} step={1000} value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value))} placeholder="Опционально" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Комиссия платформы: 15% с каждого бронирования. Первые 100 хостов — 0% на 6 месяцев.</p>
            </section>

            {/* Amenities */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Удобства и оборудование</h2>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelectedAmenities(toggleInArray(selectedAmenities, a))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      selectedAmenities.includes(a)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>

            {/* Permissions */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Разрешения</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  [
                    ["alcohol", "Алкоголь"],
                    ["loudMusic", "Громкая музыка"],
                    ["pets", "Животные"],
                    ["smoking", "Курение"],
                    ["food", "Еда"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allows[key]}
                      onChange={(e) => setAllows({ ...allows, [key]: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 accent-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Rules */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Правила</h2>
              <textarea
                rows={4}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder={"Каждое правило с новой строки:\nБез обуви на циклораме\nТишина после 22:00\nЗалог 50 000 ₸"}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 resize-none"
              />
            </section>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-4 rounded-xl text-base font-bold hover:bg-primary-dark transition-colors"
              >
                Опубликовать локацию
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
