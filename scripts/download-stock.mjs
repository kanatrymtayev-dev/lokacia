/**
 * Скачивание реальных stock-фото с Unsplash для LOKACIA.KZ
 * Бесплатно, без API ключа — через прямые URL
 *
 * Использование:
 *   node scripts/download-stock.mjs
 *   node scripts/download-stock.mjs --only=hero
 *   node scripts/download-stock.mjs --only=categories
 *   node scripts/download-stock.mjs --only=listings
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public", "images");

// ─── Unsplash direct download URLs (free, no API key needed) ────────────────
// Format: https://images.unsplash.com/photo-{id}?w={width}&q=80&auto=format

const HERO = {
  // Красивый вид Алматы с горами — реальное фото
  url: "https://images.unsplash.com/photo-1562524881-d75db76c2cd5?w=1920&q=80&auto=format",
  file: "hero.webp",
};

const CATEGORIES = {
  "photo-studio": [
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80&auto=format",  // фотостудия
    "https://images.unsplash.com/photo-1616587894289-86480e533129?w=800&q=80&auto=format",  // студия fallback
  ],
  "event-space": [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80&auto=format",  // ивент-зал
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format",  // банкет
  ],
  "apartment": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&auto=format",  // квартира
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format",  // интерьер
  ],
  "sound-stage": [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80&auto=format",  // студия звукозаписи
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80&auto=format",  // звуковая студия
  ],
  "ethno-space": [
    "https://images.unsplash.com/photo-1565537222174-2b1509aba5f4?w=800&q=80&auto=format",  // юрта
    "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800&q=80&auto=format",  // юрта fallback
  ],
  "restaurant": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format",  // ресторан
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format",  // ужин
  ],
  "meeting-room": [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format",  // переговорная
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&auto=format",  // офис
  ],
  "mountain-chalet": [
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80&auto=format",  // шале
    "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&q=80&auto=format",  // горы
  ],
};

// Реальные фото для листингов — микс Unsplash + Pexels
const LISTINGS = {
  "daylight-studio-cyclorama-6m": [
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1616587894289-86480e533129?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&q=80&auto=format",
  ],
  "loft-factory-events-200": [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80&auto=format",
  ],
  "apartment-midcentury-filming": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80&auto=format",
  ],
  "sound-stage-qazaq-500": [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800&q=80&auto=format",
  ],
  "yurt-nomad-ethno": [
    "https://images.unsplash.com/photo-1565537222174-2b1509aba5f4?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1596116050815-1b7a1c1b1b1b?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1562524881-d75db76c2cd5?w=800&q=80&auto=format",
  ],
  "restaurant-astau-banquets": [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80&auto=format",
  ],
  "mountain-chalet-kokzhailau": [
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80&auto=format",
  ],
  "coworking-hub-meeting-rooms": [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80&auto=format",
  ],
  "black-box-studio": [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800&q=80&auto=format",
  ],
  "terrasa-vysota-openair": [
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=800&q=80&auto=format",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80&auto=format",
  ],
};

// ─── Скачивание ──────────────────────────────────────────────────────────────

async function download(url, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Уже есть: ${path.basename(outputPath)}`);
    return true;
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LOKACIA-KZ/1.0 (venue marketplace)" },
    });

    if (!res.ok) {
      console.error(`  ❌ HTTP ${res.status}: ${url.slice(0, 80)}...`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ ${path.basename(outputPath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${err.message}`);
    return false;
  }
}

// ─── Генерация секций ────────────────────────────────────────────────────────

async function downloadHero() {
  console.log("\n🎯 Скачивание hero...\n");
  await download(HERO.url, path.join(PUBLIC, HERO.file));
}

async function downloadCategories() {
  console.log("\n📂 Скачивание категорий...\n");
  let ok = 0, total = 0;
  for (const [name, urls] of Object.entries(CATEGORIES)) {
    total++;
    // Пробуем первый URL, если не получится — второй
    const success = await download(urls[0], path.join(PUBLIC, "categories", `${name}.webp`));
    if (success) { ok++; continue; }
    if (urls[1]) {
      const fallback = await download(urls[1], path.join(PUBLIC, "categories", `${name}.webp`));
      if (fallback) ok++;
    }
  }
  console.log(`\n📊 Категории: ${ok}/${total}\n`);
}

async function downloadListings() {
  console.log("\n🏠 Скачивание листингов...\n");
  let ok = 0, total = 0;
  for (const [slug, urls] of Object.entries(LISTINGS)) {
    console.log(`📸 ${slug}:`);
    const dir = path.join(PUBLIC, "listings", slug);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < urls.length; i++) {
      total++;
      const success = await download(urls[i], path.join(dir, `${i + 1}.webp`));
      if (success) ok++;
    }
    console.log();
  }
  console.log(`📊 Листинги: ${ok}/${total}\n`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="))?.split("=")[1];

async function main() {
  console.log("🚀 LOKACIA.KZ — Скачивание stock-фото (Unsplash)");
  console.log(`   Выход: ${PUBLIC}\n`);

  if (onlyArg === "hero") {
    await downloadHero();
  } else if (onlyArg === "categories") {
    await downloadCategories();
  } else if (onlyArg === "listings") {
    await downloadListings();
  } else {
    await downloadHero();
    await downloadCategories();
    await downloadListings();
  }

  console.log("🏁 Готово! Бесплатно 💰");
}

main().catch(console.error);
