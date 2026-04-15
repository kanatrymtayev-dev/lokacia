"use client";

import { useState } from "react";
import { updateListingProductionFields } from "@/lib/api";
import type { Listing } from "@/lib/types";

export default function ProductionModal({
  listing,
  onClose,
  onSaved,
}: {
  listing: Listing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [powerKw, setPowerKw] = useState<number | "">(listing.powerKw ?? "");
  const [parkingCapacity, setParkingCapacity] = useState<number | "">(listing.parkingCapacity ?? "");
  const [hasFreightAccess, setHasFreightAccess] = useState(listing.hasFreightAccess ?? false);
  const [hasLoadingDock, setHasLoadingDock] = useState(listing.hasLoadingDock ?? false);
  const [hasWhiteCyc, setHasWhiteCyc] = useState(listing.hasWhiteCyc ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error: err } = await updateListingProductionFields(listing.id, {
      powerKw: powerKw === "" ? null : Number(powerKw),
      parkingCapacity: parkingCapacity === "" ? null : Number(parkingCapacity),
      hasFreightAccess,
      hasLoadingDock,
      hasWhiteCyc,
    });
    if (err) { setError("Не удалось сохранить"); setSaving(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!saving) onClose(); }} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold pr-8">Технические параметры</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{listing.title}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Электричество, кВт</label>
              <input
                type="number"
                min={0}
                max={500}
                value={powerKw}
                onChange={(e) => setPowerKw(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="15"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Парковка, мест</label>
              <input
                type="number"
                min={0}
                max={100}
                value={parkingCapacity}
                onChange={(e) => setParkingCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="3"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 outline-none text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={hasFreightAccess} onChange={(e) => setHasFreightAccess(e.target.checked)} className="w-4 h-4 accent-primary" />
            Грузовой въезд
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={hasLoadingDock} onChange={(e) => setHasLoadingDock(e.target.checked)} className="w-4 h-4 accent-primary" />
            Разгрузочная платформа
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={hasWhiteCyc} onChange={(e) => setHasWhiteCyc(e.target.checked)} className="w-4 h-4 accent-primary" />
            Белый циклорама
          </label>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </div>
    </div>
  );
}
