/**
 * Генератор изображений для LOKACIA.KZ через laozhang.ai (Nano Banana 2)
 *
 * Использование:
 *   LAOZHANG_API_KEY=sk-xxx node scripts/generate-images.mjs
 *   LAOZHANG_API_KEY=sk-xxx node scripts/generate-images.mjs --only=hero
 *   LAOZHANG_API_KEY=sk-xxx node scripts/generate-images.mjs --only=categories
 *   LAOZHANG_API_KEY=sk-xxx node scripts/generate-images.mjs --only=listings
 *   LAOZHANG_API_KEY=sk-xxx node scripts/generate-images.mjs --slug=daylight-studio-cyclorama-6m
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public", "images");

const API_KEY = process.env.LAOZHANG_API_KEY;
if (!API_KEY) {
  console.error("❌ Укажи API ключ: LAOZHANG_API_KEY=sk-xxx node scripts/generate-images.mjs");
  process.exit(1);
}

const API_URL = "https://api.laozhang.ai/v1/images/generations";

// ─── Стиль: Giggster-реф — реалистичное фото, люди в кадре, мягкий фокус ────
const STYLE = "real estate listing photo, shot on Canon EOS R5 24mm wide angle, sharp focus, crisp detail, natural colors, high resolution, normal daylight, no dramatic lighting, no HDR, no text no watermark no logo";

// Казахстанские ориентиры — горы как главный маркер
const KZ_ALMATY = "Almaty Kazakhstan, snow-capped Zailisky Alatau mountains visible in background";
const KZ_ASTANA = "Astana Kazakhstan, modern glass skyscrapers and wide steppe horizon visible in background";
// Этнический микс Казахстана
const KZ_PEOPLE = "Central Asian Kazakh and Slavic Russian looking people";

// ─── Промпты для листингов ───────────────────────────────────────────────────

const LISTING_PROMPTS = {
  "daylight-studio-cyclorama-6m": [
    `A ${KZ_PEOPLE} female photographer adjusting Profoto lights near a white cyclorama wall in a spacious daylight studio, camera on tripod, large windows with soft natural light, ${STYLE}`,
    `A ${KZ_PEOPLE} model posing on a white cyclorama backdrop while a photographer shoots tethered to laptop, softboxes set up around, bright airy studio, ${STYLE}`,
    `${KZ_PEOPLE} makeup artist applying makeup to a young woman in a studio dressing room, large mirror with bulb lights, beauty products on vanity table, ${STYLE}`,
    `Wide angle of an empty bright photography studio with white cyclorama, wooden floors, high ceilings, equipment racks on the side, morning light from windows, ${STYLE}`,
    `A small ${KZ_PEOPLE} creative team reviewing photos on a monitor in the corner of a photo studio, coffee cups on table, relaxed working atmosphere, ${STYLE}`,
  ],
  "loft-factory-events-200": [
    `A large industrial loft party with ${KZ_PEOPLE} mingling under warm string lights, exposed red brick walls, high ceilings with metal beams, DJ in background, ${STYLE}`,
    `${KZ_PEOPLE} bartender serving cocktails at a modern bar counter inside a brick-wall loft venue, guests chatting in background, warm moody lighting, ${STYLE}`,
    `An empty industrial loft event space in morning light, exposed brick, tall windows, concrete floors, chairs stacked on sides ready for setup, ${STYLE}`,
    `A rooftop terrace attached to a loft building, string lights overhead, ${KZ_PEOPLE} lounging on outdoor furniture, ${KZ_ALMATY}, city skyline at dusk, ${STYLE}`,
    `A live band performing on a small stage inside an industrial loft, ${KZ_PEOPLE} audience watching, exposed pipes and brick, stage lighting, ${STYLE}`,
  ],
  "apartment-midcentury-filming": [
    `A ${KZ_PEOPLE} film crew of three setting up a camera in a mid-century modern living room, vintage furniture, warm afternoon light through large windows with ${KZ_ALMATY} view, parquet floor, ${STYLE}`,
    `A ${KZ_PEOPLE} woman sitting on a vintage velvet sofa in a styled mid-century apartment, reading a book, warm light, retro decor, ${KZ_ALMATY} skyline visible through window, ${STYLE}`,
    `A mid-century modern kitchen with retro pastel fridge, a ${KZ_PEOPLE} person pouring coffee, warm morning light, checkerboard tiles, vintage details, ${STYLE}`,
    `Detail shot of a mid-century styled bedroom, unmade bed with linen sheets, vintage nightstand with a lamp, window with ${KZ_ALMATY} view, cozy mood, ${STYLE}`,
  ],
  "sound-stage-qazaq-500": [
    `${KZ_PEOPLE} film crew working on a set inside a massive dark sound stage, 8 meter high ceiling, lighting rig overhead, camera dolly visible, ${STYLE}`,
    `An empty professional sound stage with black walls, a single spotlight illuminating the center, vast dark space, industrial production facility, ${STYLE}`,
    `A ${KZ_PEOPLE} director and cinematographer reviewing footage on a monitor inside a sound stage, crew members in background, ${STYLE}`,
    `Loading dock of a film sound stage, large doors open, grip truck parked outside, equipment being unloaded, industrial exterior, morning light, ${STYLE}`,
    `${KZ_PEOPLE} actors in costume sitting in a makeup room of a film studio, mirrors with lights, wardrobe racks visible, behind-the-scenes, ${STYLE}`,
  ],
  "yurt-nomad-ethno": [
    `Inside a traditional Kazakh yurt, a Kazakh woman in national dress arranging a dastarkhan table with food, ornate felt carpets, warm golden light through the shanyrak, ${STYLE}`,
    `A white Kazakh yurt on a green alpine meadow with Tien Shan mountains and Almaty city visible far below in valley, a Kazakh couple walking towards it, blue sky, ${STYLE}`,
    `A wedding photoshoot inside a yurt, Kazakh bride and groom sitting on traditional cushions, colorful tuskiiz tapestries on walls, warm atmosphere, ${STYLE}`,
    `Close-up of traditional Kazakh felt ornaments and textiles inside a yurt, warm light filtering through the lattice walls, rich colors and textures, ${STYLE}`,
  ],
  "restaurant-astau-banquets": [
    `An elegantly set banquet hall with round tables, white linens, crystal chandeliers, a ${KZ_PEOPLE} waitress carrying plates, warm amber lighting, ${STYLE}`,
    `An intimate VIP dining room, a small group of ${KZ_PEOPLE} toasting with wine, soft candlelight, modern Kazakh ornamental decor on walls, ${STYLE}`,
    `A restaurant dance floor with a live band on stage, ${KZ_PEOPLE} guests dancing, festive evening atmosphere, professional lighting, ${STYLE}`,
    `A ${KZ_PEOPLE} bartender preparing drinks at a stylish restaurant bar, premium bottles on shelves, warm backlight, a couple at the bar, ${STYLE}`,
    `An outdoor restaurant patio at evening, string lights in trees, ${KZ_PEOPLE} dining at tables, greenery around, warm romantic atmosphere, ${STYLE}`,
  ],
  "mountain-chalet-kokzhailau": [
    `A ${KZ_PEOPLE} couple sitting by a stone fireplace in a mountain chalet living room, panoramic window showing snowy Tien Shan mountains and ${KZ_ALMATY} city lights below, cozy wooden beams, ${STYLE}`,
    `Morning on a wooden chalet terrace, a ${KZ_PEOPLE} person with coffee looking at Tien Shan mountain panorama, outdoor furniture, fresh mountain air, ${STYLE}`,
    `A cozy mountain chalet bedroom, unmade bed with fur throw, large window with mountain view, warm lamplight, wooden walls, intimate atmosphere, ${STYLE}`,
    `${KZ_PEOPLE} friends gathering around a rustic wooden dining table in a mountain chalet, food and wine on table, warm pendant lights, ${STYLE}`,
    `Exterior of a wooden mountain chalet at golden hour, snow-capped peaks behind, pine trees, a person on the porch, warm light from windows, ${STYLE}`,
  ],
  "coworking-hub-meeting-rooms": [
    `A business meeting in a modern glass-walled conference room, 6 ${KZ_PEOPLE} at a table, one presenting on a large screen, ${KZ_ASTANA} Bayterek tower visible through window, ${STYLE}`,
    `Two ${KZ_PEOPLE} having an informal meeting in a small pod in a coworking space, laptops open, coffee cups, acoustic panels, focused atmosphere, ${STYLE}`,
    `A modern coworking lobby, a ${KZ_PEOPLE} woman at a coffee machine, lounge chairs and plants, people working in background, clean bright space, ${STYLE}`,
    `Wide angle of an open-plan coworking space with glass meeting rooms visible, ${KZ_PEOPLE} working at desks, ${KZ_ASTANA} skyline through panoramic windows, ${STYLE}`,
  ],
  "black-box-studio": [
    `A ${KZ_PEOPLE} videographer operating a camera on a tripod in a dark black-wall studio, LED panel lights, green screen rolled up in corner, ${STYLE}`,
    `A ${KZ_PEOPLE} product photographer arranging items on a light table in a black studio, softboxes around, tethered camera to monitor, ${STYLE}`,
    `Two ${KZ_PEOPLE} podcast hosts sitting at a desk with microphones in a black studio, acoustic foam on walls, warm desk light, recording in progress, ${STYLE}`,
    `A music video shoot in a black studio, a ${KZ_PEOPLE} dancer performing under colored LED lights, camera crew filming, creative atmosphere, ${STYLE}`,
  ],
  "terrasa-vysota-openair": [
    `${KZ_PEOPLE} enjoying cocktails on a rooftop terrace with panoramic mountain view at sunset, string lights overhead, modern lounge furniture, ${KZ_ALMATY} skyline with Hotel Kazakhstan tower, ${STYLE}`,
    `A DJ playing music on a rooftop terrace party, ${KZ_PEOPLE} dancing, ${KZ_ALMATY} city lights and Kok-Tobe TV tower in background, purple twilight sky, ${STYLE}`,
    `A daytime corporate event on a rooftop terrace, ${KZ_PEOPLE} seated in rows facing a presenter, mountain backdrop, professional outdoor setup, ${STYLE}`,
    `Close-up of colorful cocktails on a rooftop bar counter, blurred city and mountain view in background, evening atmosphere, warm lighting, ${STYLE}`,
    `A wedding ceremony on a rooftop terrace, ${KZ_PEOPLE} couple at a floral arch, guests watching, mountains and sunset behind, romantic light, ${STYLE}`,
  ],
};

// ─── Промпты для лендинга ────────────────────────────────────────────────────

const HERO_PROMPT =
  `A stunning creative event space in Almaty with floor-to-ceiling windows showing Tien Shan mountains and Kok-Tobe hill, a film crew setting up cameras inside, golden hour light flooding in, elegant modern interior, Hotel Kazakhstan tower visible in the distance, ${STYLE}`;

const CATEGORY_PROMPTS = {
  "photo-studio": `A photographer directing a model on a white cyclorama in a bright daylight studio, studio lights around, professional atmosphere, ${STYLE}`,
  "event-space": `A beautifully decorated event hall during a party, people dancing under chandeliers, warm festive lighting, elegant venue, ${STYLE}`,
  "apartment": `A film crew setting up a shot in a stylish designer apartment, camera on tripod, warm afternoon light through windows, lifestyle location, ${STYLE}`,
  "sound-stage": `Film crew working inside a large dark sound stage, lighting rig overhead, camera equipment, behind the scenes atmosphere, ${STYLE}`,
  "ethno-space": `A woman in traditional Kazakh dress inside a beautiful yurt, ornate carpets and felt wall hangings, warm golden light, cultural atmosphere, ${STYLE}`,
  "restaurant": `Guests toasting at an elegant restaurant dinner table, chandelier above, warm amber candlelight, festive dining atmosphere, ${STYLE}`,
  "meeting-room": `Business people in a modern glass-walled meeting room, one person presenting, natural daylight, clean professional space, ${STYLE}`,
  "mountain-chalet": `A person with coffee on a mountain chalet terrace, panoramic view of snow-capped mountains, wooden deck, morning golden light, ${STYLE}`,
};

// ─── API вызов ───────────────────────────────────────────────────────────────

async function generateImage(prompt, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Уже есть: ${path.basename(outputPath)}`);
    return true;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "flux-kontext-pro",
        prompt,
        n: 1,
        size: "1536x1024",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ API ошибка (${res.status}): ${err}`);
      return false;
    }

    const json = await res.json();
    const item = json.data?.[0];
    if (!item) {
      console.error(`  ❌ Нет данных в ответе:`, JSON.stringify(json));
      return false;
    }

    let buffer;
    if (item.b64_json) {
      // gpt-image-1 возвращает base64
      buffer = Buffer.from(item.b64_json, "base64");
    } else if (item.url) {
      // dall-e-3 возвращает URL
      const imgRes = await fetch(item.url);
      if (!imgRes.ok) {
        console.error(`  ❌ Не удалось скачать: ${item.url}`);
        return false;
      }
      buffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      console.error(`  ❌ Неизвестный формат ответа`);
      return false;
    }
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ ${path.basename(outputPath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (err) {
    console.error(`  ❌ Ошибка: ${err.message}`);
    return false;
  }
}

// ─── Генерация ───────────────────────────────────────────────────────────────

async function generateListings(slugFilter) {
  console.log("\n🏠 Генерация изображений для листингов...\n");

  const entries = Object.entries(LISTING_PROMPTS);
  let total = 0;
  let success = 0;

  for (const [slug, prompts] of entries) {
    if (slugFilter && slug !== slugFilter) continue;

    console.log(`📸 ${slug}:`);
    const dir = path.join(PUBLIC, "listings", slug);
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < prompts.length; i++) {
      total++;
      const ok = await generateImage(prompts[i], path.join(dir, `${i + 1}.webp`));
      if (ok) success++;
      // Пауза между запросами чтобы не получить rate limit
      await new Promise((r) => setTimeout(r, 1000));
    }
    console.log();
  }

  console.log(`📊 Листинги: ${success}/${total} изображений\n`);
}

async function generateHero() {
  console.log("\n🎯 Генерация hero-изображения...\n");
  const ok = await generateImage(HERO_PROMPT, path.join(PUBLIC, "hero.webp"));
  console.log(ok ? "✅ Hero готов\n" : "❌ Hero не удалось\n");
}

async function generateCategories() {
  console.log("\n📂 Генерация изображений категорий...\n");

  const dir = path.join(PUBLIC, "categories");
  fs.mkdirSync(dir, { recursive: true });

  let total = 0;
  let success = 0;

  for (const [name, prompt] of Object.entries(CATEGORY_PROMPTS)) {
    total++;
    const ok = await generateImage(prompt, path.join(dir, `${name}.webp`));
    if (ok) success++;
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n📊 Категории: ${success}/${total} изображений\n`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="))?.split("=")[1];
const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

async function main() {
  console.log("🚀 LOKACIA.KZ — Генератор изображений (laozhang.ai / Nano Banana 2)");
  console.log(`   API: ${API_URL}`);
  console.log(`   Ключ: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`   Выход: ${PUBLIC}\n`);

  if (slugArg) {
    await generateListings(slugArg);
  } else if (onlyArg === "hero") {
    await generateHero();
  } else if (onlyArg === "categories") {
    await generateCategories();
  } else if (onlyArg === "listings") {
    await generateListings();
  } else {
    await generateHero();
    await generateCategories();
    await generateListings();
  }

  console.log("🏁 Готово!");
}

main().catch(console.error);
