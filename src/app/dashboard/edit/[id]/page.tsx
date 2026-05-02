"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/navbar";
import { useAuth } from "@/lib/auth-context";
import { getListingById, updateListing, uploadListingImages } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { SPACE_TYPE_LABELS, ACTIVITY_TYPE_LABELS, CITY_LABELS, STYLE_LABELS } from "@/lib/types";
import type { SpaceType, ActivityType, City, Style, Listing } from "@/lib/types";

const spaceTypes = Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][];
const activityTypes = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][];
const cities = Object.entries(CITY_LABELS) as [City, string][];
const stylesList = Object.entries(STYLE_LABELS) as [Style, string][];

const AMENITY_KEYS = ["wifi","parking","ac","kitchen","dressing","daylight","soundproof","projector","stage","generator","greenscreen","cyclorama","led","bar","terrace","fireplace","dancefloor"];

export default function EditListingPage() {
  const { t } = useT();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const AMENITY_OPTIONS = AMENITY_KEYS.map(k => t(`amenity.${k}`));
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [spaceType, setSpaceType] = useState<SpaceType>("photo_studio");
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  const [city, setCity] = useState<City>("almaty");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState(50);
  const [capacity, setCapacity] = useState(10);
  const [ceilingHeight, setCeilingHeight] = useState(3);
  const [pricePerHour, setPricePerHour] = useState(10000);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(0);
  const [minHours, setMinHours] = useState(2);
  const [selectedStyles, setSelectedStyles] = useState<Style[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [allows, setAllows] = useState({
    alcohol: false, loudMusic: false, pets: false, smoking: false, food: true,
  });
  const [rules, setRules] = useState("");

  // Images: existing URLs + new files
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Load listing
  useEffect(() => {
    if (!listingId) return;
    getListingById(listingId).then((l) => {
      if (!l) { router.push("/dashboard"); return; }
      setListing(l);
      setTitle(l.title);
      setDescription(l.description);
      setSpaceType(l.spaceType);
      setSelectedActivities(l.activityTypes);
      setCity(l.city);
      setDistrict(l.district);
      setAddress(l.address);
      setArea(l.area);
      setCapacity(l.capacity);
      setCeilingHeight(l.ceilingHeight ?? 3);
      setPricePerHour(l.pricePerHour);
      setPricePerDay(l.pricePerDay ?? 0);
      setSecurityDeposit(l.securityDeposit ?? 0);
      setMinHours(l.minHours);
      setSelectedStyles(l.styles);
      setSelectedAmenities(l.amenities);
      setAllows(l.allows);
      setRules(l.rules.join("\n"));
      setExistingImages(l.images);
      setLoadingListing(false);
    });
  }, [listingId, router]);

  // Security check
  useEffect(() => {
    if (!user) router.push("/login");
    if (listing && user && listing.hostId !== user.id) router.push("/dashboard");
  }, [user, listing, router]);

  function toggleInArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalImages = existingImages.length + newImageFiles.length + files.length;
    if (totalImages > 10) {
      setError(t("newListing.maxPhotos"));
      return;
    }
    setNewImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setNewImagePreviews((prev) => [...prev, url]);
    });
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !listing) return;

    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages === 0) {
      setError(t("newListing.minPhoto"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Upload new images if any
      let allImages = [...existingImages];
      if (newImageFiles.length > 0) {
        const newUrls = await uploadListingImages(newImageFiles, user.id);
        allImages = [...allImages, ...newUrls];
      }

      const { error: updateError } = await updateListing(listing.id, user.id, {
        title, description, spaceType, activityTypes: selectedActivities,
        city, district, address, area, capacity, ceilingHeight,
        pricePerHour, pricePerDay: pricePerDay || null,
        securityDeposit: securityDeposit || 0,
        minHours, styles: selectedStyles, amenities: selectedAmenities,
        allows, rules: rules.split("\n").filter(Boolean),
        images: allImages,
      });

      if (updateError) {
        setError(t("newListing.saveError") + ": " + updateError.message);
        setSaving(false);
        return;
      }

      await fetch("/api/revalidate", { method: "POST" });

      // Auto-translate listing content (async, non-blocking)
      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      }).catch(() => {/* silent — translation is best-effort */});

      setSaved(true);
      setTimeout(() => router.push(`/listing/${listing.slug}`), 1500);
    } catch {
      setError(t("newListing.genericError"));
    } finally {
      setSaving(false);
    }
  }

  if (!user || loadingListing) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-pulse text-gray-400">Загрузка...</div>
        </main>
      </div>
    );
  }

  if (!listing) return null;

  const totalImageCount = existingImages.length + newImagePreviews.length;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold mb-2">Редактировать локацию</h1>
          <p className="text-gray-600 mb-8">Измените информацию о вашем помещении</p>

          {saved && (
            <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
              </svg>
              Изменения сохранены! Перенаправляем...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic info */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Основная информация</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
                <textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 resize-none" />
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
                  <input type="text" required value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес *</label>
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подходит для *</label>
                <div className="flex flex-wrap gap-2">
                  {activityTypes.map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setSelectedActivities(toggleInArray(selectedActivities, v))} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedActivities.includes(v) ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Стиль</label>
                <div className="flex flex-wrap gap-2">
                  {stylesList.map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setSelectedStyles(toggleInArray(selectedStyles, v))} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${selectedStyles.includes(v) ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
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
                  <input type="number" min={0} step={1000} value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value))} placeholder={t("newListing.priceOptional")} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Залоговый депозит (₸)</label>
                <input type="number" min={0} step={5000} value={securityDeposit} onChange={(e) => setSecurityDeposit(Number(e.target.value))} placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900" />
                <p className="text-xs text-gray-400 mt-1">0 = без залога. Возвращается арендатору через 48ч после завершения.</p>
              </div>
            </section>

            {/* Amenities */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Удобства и оборудование</h2>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => setSelectedAmenities(toggleInArray(selectedAmenities, a))} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${selectedAmenities.includes(a) ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </section>

            {/* Permissions */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Разрешения</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([["alcohol", t("listing.rule.alcohol")], ["loudMusic", t("listing.rule.loudMusic")], ["pets", t("listing.rule.pets")], ["smoking", t("listing.rule.smoking")], ["food", t("listing.rule.food")]] as [keyof typeof allows, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={allows[key]} onChange={(e) => setAllows({ ...allows, [key]: e.target.checked })} className="w-4 h-4 rounded border-gray-300 accent-primary" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Rules */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Правила</h2>
              <textarea rows={4} value={rules} onChange={(e) => setRules(e.target.value)} placeholder={t("editListing.rulesPh")} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 resize-none" />
            </section>

            {/* Photos */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h2 className="text-lg font-bold">Фотографии *</h2>
              <p className="text-sm text-gray-500">До 10 фотографий. Первое фото будет обложкой.</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {/* Existing images */}
                {existingImages.map((src, i) => (
                  <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                    <Image src={src} alt={`Фото ${i + 1}`} fill className="object-cover" sizes="150px" />
                    <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                    {i === 0 && existingImages.length > 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">Обложка</span>
                    )}
                  </div>
                ))}
                {/* New images */}
                {newImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group ring-2 ring-green-400">
                    <Image src={src} alt={`Новое фото ${i + 1}`} fill className="object-cover" sizes="150px" />
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">Новое</span>
                  </div>
                ))}
                {/* Add button */}
                {totalImageCount < 10 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-xs text-gray-400 mt-1">Добавить</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <button type="submit" disabled={saving || saved} className="flex-1 bg-primary text-white py-4 rounded-xl text-base font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
                {saving ? t("editListing.saving") : saved ? t("editListing.saved") : t("editListing.save")}
              </button>
              <button type="button" onClick={() => router.push(`/listing/${listing.slug}`)} className="px-6 py-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
