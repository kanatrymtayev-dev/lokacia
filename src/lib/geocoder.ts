// Nominatim (OpenStreetMap) — бесплатный геокодер, без ключа.
// Лимит: 1 запрос/сек, обязательный User-Agent с контактом.
// Документация: https://nominatim.org/release-docs/latest/api/Search/

const CITY_RU: Record<string, string> = {
  almaty: "Алматы",
  astana: "Астана",
  shymkent: "Шымкент",
  karaganda: "Караганда",
};

const USER_AGENT = "Lokacia.kz/1.0 (https://lokacia.kz; contact@lokacia.kz)";

export async function geocodeAddress(
  city: string,
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;
  const cityRu = CITY_RU[city] ?? city;
  const q = `${address}, ${cityRu}, Казахстан`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=kz&accept-language=ru`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = json?.[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
