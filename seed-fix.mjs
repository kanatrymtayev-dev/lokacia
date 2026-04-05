// Creates tables and seeds data using Supabase Management API
import { createClient } from "@supabase/supabase-js";

const url = "https://hwukpfqiiszaokgzhbfk.supabase.co";
const key = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Check if listings table exists by trying a query
const { error: checkError } = await supabase.from("listings").select("id").limit(1);

if (checkError && checkError.message.includes("not find")) {
  console.log("Table 'listings' does not exist. Creating via RPC...");

  // Use raw SQL via rpc
  const { error: sqlError } = await supabase.rpc("exec_sql", {
    query: `SELECT 1`
  });

  // If rpc doesn't work, we'll use the REST endpoint
  console.log("Please run the listings SQL in SQL Editor first.");
  console.log("Then re-run this script.");
  process.exit(1);
}

console.log("Table exists, proceeding with seed...");

const hostId = "42f8ec10-cd97-40da-8a5b-3e2040f06632";

const listings = [
  { title: "Daylight Studio — Циклорама 6м", slug: "daylight-studio-cyclorama-6m", description: "Просторная фотостудия с белой циклорамой 6 метров, панорамными окнами и естественным светом. Полный комплект студийного оборудования.", space_type: "photo_studio", activity_types: ["production"], city: "almaty", district: "Медеуский", address: "ул. Панфилова 78", lat: 43.238, lng: 76.946, area: 120, capacity: 15, ceiling_height: 4.5, price_per_hour: 8000, price_per_day: 50000, min_hours: 2, images: ["https://picsum.photos/seed/lokacia1/800/600","https://picsum.photos/seed/lokacia2/800/600","https://picsum.photos/seed/lokacia3/800/600"], styles: ["modern","minimalist"], amenities: ["Циклорама 6м","Profoto оборудование","Естественный свет","Гримёрная","Кухня","Wi-Fi","Парковка"], rules: ["Без обуви на циклораме","Уборка включена"], allows_alcohol: false, allows_loud_music: false, allows_pets: false, allows_smoking: false, allows_food: true, rating: 4.9, review_count: 47, instant_book: true, superhost: true },
  { title: "Лофт FACTORY — Ивенты до 200 человек", slug: "loft-factory-events-200", description: "Индустриальный лофт 350м² с высокими потолками, кирпичными стенами. Два зала.", space_type: "loft", activity_types: ["event","production"], city: "almaty", district: "Бостандыкский", address: "ул. Тимирязева 42", lat: 43.235, lng: 76.926, area: 350, capacity: 200, ceiling_height: 6, price_per_hour: 25000, price_per_day: 180000, min_hours: 4, images: ["https://picsum.photos/seed/lokacia10/800/600","https://picsum.photos/seed/lokacia11/800/600"], styles: ["industrial","loft"], amenities: ["Сцена","Звук","Проектор","Кухня","Бар","Терраса","Парковка 30 мест"], rules: ["Окончание до 23:00","Залог 100 000 ₸"], allows_alcohol: true, allows_loud_music: true, allows_pets: false, allows_smoking: false, allows_food: true, rating: 4.8, review_count: 93, instant_book: false, superhost: true },
  { title: "Квартира mid-century для съёмок", slug: "apartment-midcentury-filming", description: "Стильная квартира 85м² в центре Алматы. Дизайнерский ремонт, винтажная мебель.", space_type: "apartment", activity_types: ["production"], city: "almaty", district: "Алмалинский", address: "ул. Кабанбай Батыра 120", lat: 43.257, lng: 76.948, area: 85, capacity: 10, ceiling_height: 3, price_per_hour: 5000, price_per_day: 35000, min_hours: 3, images: ["https://picsum.photos/seed/lokacia20/800/600","https://picsum.photos/seed/lokacia21/800/600"], styles: ["vintage","modern"], amenities: ["Дизайнерская мебель","Естественный свет","Кухня","Wi-Fi"], rules: ["Без обуви","Тишина после 21:00"], allows_alcohol: false, allows_loud_music: false, allows_pets: false, allows_smoking: false, allows_food: true, rating: 4.7, review_count: 28, instant_book: true, superhost: false },
  { title: "Sound Stage QAZAQ — Павильон 500м²", slug: "sound-stage-qazaq-500", description: "Профессиональный звуковой павильон. 500м², потолки 8м, звукоизоляция, 200 кВт.", space_type: "sound_stage", activity_types: ["production"], city: "almaty", district: "Наурызбайский", address: "Казахфильм, павильон 4", lat: 43.208, lng: 76.882, area: 500, capacity: 50, ceiling_height: 8, price_per_hour: 50000, price_per_day: 350000, min_hours: 8, images: ["https://picsum.photos/seed/lokacia30/800/600","https://picsum.photos/seed/lokacia31/800/600"], styles: ["industrial"], amenities: ["Звукоизоляция","200 кВт","Грузовой доступ","Гримёрные","Парковка"], rules: ["Минимум 8 часов","Бронирование за 7 дней"], allows_alcohol: false, allows_loud_music: true, allows_pets: false, allows_smoking: false, allows_food: true, rating: 5.0, review_count: 12, instant_book: false, superhost: false },
  { title: "Юрта «Номад» — Этно-площадка", slug: "yurt-nomad-ethno", description: "Аутентичная казахская юрта с традиционным убранством. 60м², вид на горы.", space_type: "yurt", activity_types: ["production","event"], city: "almaty", district: "Медеуский", address: "пос. Тау-Самалы", lat: 43.19, lng: 76.97, area: 60, capacity: 30, ceiling_height: null, price_per_hour: 15000, price_per_day: 100000, min_hours: 3, images: ["https://picsum.photos/seed/lokacia40/800/600","https://picsum.photos/seed/lokacia41/800/600"], styles: ["ethno","rustic"], amenities: ["Традиционное убранство","Вид на горы","Дастархан","Парковка","Генератор"], rules: ["Обувь снимать","Согласование декора заранее"], allows_alcohol: true, allows_loud_music: false, allows_pets: false, allows_smoking: false, allows_food: true, rating: 4.9, review_count: 35, instant_book: false, superhost: true },
  { title: "Ресторан «Астау» — Банкеты и тои", slug: "restaurant-astau-banquets", description: "Элегантный ресторан, два зала: на 150 и VIP на 30.", space_type: "restaurant", activity_types: ["event"], city: "almaty", district: "Ауэзовский", address: "пр. Абая 150", lat: 43.24, lng: 76.89, area: 400, capacity: 150, ceiling_height: 4, price_per_hour: 35000, price_per_day: 250000, min_hours: 5, images: ["https://picsum.photos/seed/lokacia50/800/600","https://picsum.photos/seed/lokacia51/800/600"], styles: ["classic","modern"], amenities: ["Кухня","Сцена","Танцпол","Звук","Проектор","Парковка 50 мест"], rules: ["Окончание до 00:00","Залог 200 000 ₸"], allows_alcohol: true, allows_loud_music: true, allows_pets: false, allows_smoking: false, allows_food: true, rating: 4.6, review_count: 64, instant_book: false, superhost: false },
  { title: "Горное шале «Көкжайлау»", slug: "mountain-chalet-kokzhailau", description: "Шале на высоте 1400м с панорамным видом. 180м², камин, терраса 50м².", space_type: "chalet", activity_types: ["production","event","leisure"], city: "almaty", district: "Медеуский", address: "Горная резиденция, дом 7", lat: 43.16, lng: 77.06, area: 180, capacity: 25, ceiling_height: 3.5, price_per_hour: 20000, price_per_day: 150000, min_hours: 4, images: ["https://picsum.photos/seed/lokacia60/800/600","https://picsum.photos/seed/lokacia61/800/600"], styles: ["rustic","modern"], amenities: ["Панорамный вид","Камин","Терраса","3 спальни","Кухня","Парковка"], rules: ["Тишина после 22:00","Запрет на фейерверки"], allows_alcohol: true, allows_loud_music: false, allows_pets: true, allows_smoking: false, allows_food: true, rating: 4.8, review_count: 19, instant_book: false, superhost: false },
  { title: "Коворкинг HUB — Переговорные", slug: "coworking-hub-meeting-rooms", description: "Коворкинг в центре Астаны. 5 переговорных от 4 до 20 человек.", space_type: "coworking", activity_types: ["meeting","production"], city: "astana", district: "Есильский", address: "пр. Мәңгілік Ел 35", lat: 51.128, lng: 71.43, area: 45, capacity: 20, ceiling_height: 3, price_per_hour: 6000, price_per_day: null, min_hours: 1, images: ["https://picsum.photos/seed/lokacia70/800/600","https://picsum.photos/seed/lokacia71/800/600"], styles: ["modern","minimalist"], amenities: ["ТВ","Маркерные доски","Видеоконференция","Кофе-машина","Wi-Fi","Парковка"], rules: ["Без еды в переговорных"], allows_alcohol: false, allows_loud_music: false, allows_pets: false, allows_smoking: false, allows_food: false, rating: 4.5, review_count: 41, instant_book: true, superhost: false },
  { title: "Black Box Studio — Фото и видео", slug: "black-box-studio", description: "Чёрная студия 90м² с звукоизоляцией. Godox, LED-панели, зелёный экран.", space_type: "video_studio", activity_types: ["production"], city: "almaty", district: "Бостандыкский", address: "ул. Розыбакиева 247", lat: 43.228, lng: 76.929, area: 90, capacity: 12, ceiling_height: 4, price_per_hour: 10000, price_per_day: 65000, min_hours: 2, images: ["https://picsum.photos/seed/lokacia80/800/600","https://picsum.photos/seed/lokacia81/800/600"], styles: ["modern","industrial"], amenities: ["Звукоизоляция","Зелёный экран","LED-панели","Godox","Гримёрная","Wi-Fi"], rules: ["Обувь снимать","Не более 12 человек"], allows_alcohol: false, allows_loud_music: true, allows_pets: false, allows_smoking: false, allows_food: false, rating: 4.9, review_count: 56, instant_book: true, superhost: true },
  { title: "Терраса «Высота» — Open-air", slug: "terrasa-vysota-openair", description: "Терраса на крыше с видом на горы. 250м² open-air + 80м² крытая зона.", space_type: "outdoor", activity_types: ["event","production","leisure"], city: "almaty", district: "Медеуский", address: "пр. Достык 89, крыша", lat: 43.243, lng: 76.955, area: 330, capacity: 120, ceiling_height: null, price_per_hour: 30000, price_per_day: 200000, min_hours: 3, images: ["https://picsum.photos/seed/lokacia90/800/600","https://picsum.photos/seed/lokacia91/800/600"], styles: ["modern"], amenities: ["Вид на горы","Бар","DJ-пульт","Освещение","Крытая зона","Парковка"], rules: ["Сезон: май-сентябрь","Окончание до 23:00","Залог 150 000 ₸"], allows_alcohol: true, allows_loud_music: true, allows_pets: false, allows_smoking: true, allows_food: true, rating: 4.7, review_count: 38, instant_book: false, superhost: false },
];

for (const listing of listings) {
  const { error } = await supabase.from("listings").upsert(
    { host_id: hostId, status: "active", ...listing },
    { onConflict: "slug" }
  );
  if (error) {
    console.error(`✗ ${listing.slug}: ${error.message}`);
  } else {
    console.log(`✓ ${listing.title}`);
  }
}

console.log("\nDone!");
