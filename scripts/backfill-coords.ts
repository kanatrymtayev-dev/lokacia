// Бэкфил координат для существующих листингов (lat=0 OR lng=0).
// Запуск: npx tsx scripts/backfill-coords.ts
//
// Требует SUPABASE_SERVICE_ROLE_KEY в .env.local — обычный anon key не сможет
// писать в чужие листинги (RLS).
// Получить ключ: Supabase Dashboard → Settings → API → service_role key.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { geocodeAddress } from "../src/lib/geocoder";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !KEY) {
  console.error("\n❌ Не заданы переменные окружения.");
  console.error("");
  console.error("Добавь в .env.local:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://...");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJ...   (Dashboard → Settings → API → service_role secret)");
  console.error("");
  process.exit(1);
}

const sb = createClient(URL, KEY);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("🔍 Загружаю листинги без координат...");
  const { data, error } = await sb
    .from("listings")
    .select("id, city, address")
    .or("lat.eq.0,lng.eq.0");

  if (error) {
    console.error("Ошибка чтения listings:", error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.log("✓ Все листинги уже имеют координаты. Делать нечего.");
    return;
  }

  console.log(`Найдено ${data.length} листингов без координат. Начинаю...\n`);

  let geocoded = 0;
  let skipped = 0;

  for (const row of data as Array<{ id: string; city: string; address: string }>) {
    const coords = await geocodeAddress(row.city, row.address);
    if (!coords) {
      console.error(`[skip] ${row.id} → ${row.city}, ${row.address}`);
      skipped++;
    } else {
      const { error: upErr } = await sb
        .from("listings")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", row.id);
      if (upErr) {
        console.error(`[fail] ${row.id} → ${upErr.message}`);
        skipped++;
      } else {
        console.log(`[ok]   ${row.id} → ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}  (${row.address})`);
        geocoded++;
      }
    }
    await sleep(1100); // Nominatim лимит — 1 req/sec, держим запас
  }

  console.log(`\n✓ Готово. Geocoded: ${geocoded}, Skipped: ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
