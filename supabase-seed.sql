-- LOKACIA.KZ Seed Data
-- Run this in Supabase SQL Editor AFTER creating a host account
-- Replace HOST_ID with the actual UUID from profiles table

-- First, check your host user ID:
-- SELECT id, name, role FROM profiles;

-- Then replace 'HOST_ID' below with the actual UUID and run.

-- For now, we'll create a service host profile directly:
DO $$
DECLARE
  host_id uuid;
BEGIN
  -- Create a fake host profile for seeding (will be linked to real user later)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'seed-host@lokacia.kz',
    crypt('seedhost123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"LOKACIA Team","role":"host"}',
    now(), now(), 'authenticated', 'authenticated', ''
  ) ON CONFLICT (id) DO NOTHING;

  host_id := 'a0000000-0000-0000-0000-000000000001';

  -- Ensure profile exists
  INSERT INTO profiles (id, name, phone, role) VALUES
    (host_id, 'LOKACIA Team', '+7 700 000 0000', 'host')
  ON CONFLICT (id) DO NOTHING;

  -- Insert listings
  INSERT INTO listings (host_id, title, slug, description, space_type, activity_types, city, district, address, lat, lng, area, capacity, ceiling_height, price_per_hour, price_per_day, min_hours, images, styles, amenities, rules, allows_alcohol, allows_loud_music, allows_pets, allows_smoking, allows_food, rating, review_count, instant_book, superhost, status) VALUES
  (
    host_id,
    'Daylight Studio — Циклорама 6м',
    'daylight-studio-cyclorama-6m',
    'Просторная фотостудия с белой циклорамой 6 метров, панорамными окнами и естественным светом. Полный комплект студийного оборудования: 4 импульсных источника Profoto, софтбоксы, фоны. Идеально для каталожной съёмки, портретов и видеоконтента. Гримёрная комната, кухня для перерывов.',
    'photo_studio', '{production}', 'almaty', 'Медеуский', 'ул. Панфилова 78, офис 12',
    43.238, 76.946, 120, 15, 4.5, 8000, 50000, 2,
    '{https://picsum.photos/seed/lokacia1/800/600,https://picsum.photos/seed/lokacia2/800/600,https://picsum.photos/seed/lokacia3/800/600,https://picsum.photos/seed/lokacia4/800/600}',
    '{modern,minimalist}',
    '{Циклорама 6м,Profoto оборудование,Естественный свет,Гримёрная,Кухня,Wi-Fi,Парковка,Кондиционер}',
    '{Без обуви на циклораме,Уборка включена в стоимость,Не более 15 человек}',
    false, false, false, false, true, 4.9, 47, true, true, 'active'
  ),
  (
    host_id,
    'Лофт FACTORY — Ивенты до 200 человек',
    'loft-factory-events-200',
    'Индустриальный лофт площадью 350м² с высокими потолками, кирпичными стенами и панорамными окнами. Два зала: основной на 200 человек и VIP на 40. Профессиональный звук и свет, сцена, проектор.',
    'loft', '{event,production}', 'almaty', 'Бостандыкский', 'ул. Тимирязева 42',
    43.235, 76.926, 350, 200, 6, 25000, 180000, 4,
    '{https://picsum.photos/seed/lokacia10/800/600,https://picsum.photos/seed/lokacia11/800/600,https://picsum.photos/seed/lokacia12/800/600}',
    '{industrial,loft}',
    '{Сцена,Профессиональный звук,Проектор,Кухня,Бар,Терраса,Парковка 30 мест,Wi-Fi,Кондиционер}',
    '{Окончание мероприятий до 23:00,Залог 100 000 ₸,Уборка включена}',
    true, true, false, false, true, 4.8, 93, false, true, 'active'
  ),
  (
    host_id,
    'Квартира в стиле mid-century для съёмок',
    'apartment-midcentury-filming',
    'Стильная двухкомнатная квартира 85м² в центре Алматы. Дизайнерский ремонт в стиле mid-century modern: винтажная мебель, тёплые тона, паркет. Большие окна, много света.',
    'apartment', '{production}', 'almaty', 'Алмалинский', 'ул. Кабанбай Батыра 120, кв. 15',
    43.257, 76.948, 85, 10, 3, 5000, 35000, 3,
    '{https://picsum.photos/seed/lokacia20/800/600,https://picsum.photos/seed/lokacia21/800/600,https://picsum.photos/seed/lokacia22/800/600}',
    '{vintage,modern}',
    '{Дизайнерская мебель,Естественный свет,Кухня,Wi-Fi,Парковка во дворе}',
    '{Без обуви,Не двигать мебель без согласования,Тишина после 21:00}',
    false, false, false, false, true, 4.7, 28, true, false, 'active'
  ),
  (
    host_id,
    'Sound Stage QAZAQ — Павильон 500м²',
    'sound-stage-qazaq-500',
    'Профессиональный звуковой павильон для кино и видеопродакшн. 500м², высота потолков 8м, полная звукоизоляция. Электрическая мощность 200 кВт, грузовой доступ для декораций.',
    'sound_stage', '{production}', 'almaty', 'Наурызбайский', 'Казахфильм, павильон 4',
    43.208, 76.882, 500, 50, 8, 50000, 350000, 8,
    '{https://picsum.photos/seed/lokacia30/800/600,https://picsum.photos/seed/lokacia31/800/600,https://picsum.photos/seed/lokacia32/800/600}',
    '{industrial}',
    '{Звукоизоляция,200 кВт мощность,Грузовой доступ,Гримёрные,Комната отдыха,Парковка,Wi-Fi}',
    '{Минимум 8 часов,Техник-консультант включён,Бронирование за 7 дней}',
    false, true, false, false, true, 5.0, 12, false, false, 'active'
  ),
  (
    host_id,
    'Юрта «Номад» — Этно-площадка для съёмок',
    'yurt-nomad-ethno',
    'Аутентичная казахская юрта с полным традиционным убранством: сырмақ, тұскиіз, текемет, дастархан. Площадь юрты 60м², установлена на территории частного подворья с видом на горы.',
    'yurt', '{production,event}', 'almaty', 'Медеуский', 'пос. Тау-Самалы, ул. Жибек Жолы 5',
    43.19, 76.97, 60, 30, null, 15000, 100000, 3,
    '{https://picsum.photos/seed/lokacia40/800/600,https://picsum.photos/seed/lokacia41/800/600,https://picsum.photos/seed/lokacia42/800/600}',
    '{ethno,rustic}',
    '{Традиционное убранство,Вид на горы,Дастархан,Территория 500м²,Парковка,Генератор}',
    '{Бережное отношение к убранству,Обувь при входе снимать,Согласование декора заранее}',
    true, false, false, false, true, 4.9, 35, false, true, 'active'
  ),
  (
    host_id,
    'Ресторан «Астау» — Банкеты и тои',
    'restaurant-astau-banquets',
    'Элегантный ресторан с двумя залами: основной на 150 человек и VIP на 30. Современный интерьер с элементами казахского орнамента. Собственная кухня, профессиональный звук и свет.',
    'restaurant', '{event}', 'almaty', 'Ауэзовский', 'пр. Абая 150',
    43.24, 76.89, 400, 150, 4, 35000, 250000, 5,
    '{https://picsum.photos/seed/lokacia50/800/600,https://picsum.photos/seed/lokacia51/800/600,https://picsum.photos/seed/lokacia52/800/600}',
    '{classic,modern}',
    '{Кухня,Сцена,Танцпол,Профессиональный звук,Проектор,Парковка 50 мест,Wi-Fi,Кондиционер}',
    '{Окончание до 00:00,Своё спиртное запрещено,Залог 200 000 ₸}',
    true, true, false, false, true, 4.6, 64, false, false, 'active'
  ),
  (
    host_id,
    'Горное шале «Көкжайлау» — Вид на город',
    'mountain-chalet-kokzhailau',
    'Уютное шале на высоте 1400м с панорамным видом на Алматы. 180м², 3 спальни, камин, терраса 50м². Идеально для камерных мероприятий, retreats, фотосессий на фоне гор.',
    'chalet', '{production,event,leisure}', 'almaty', 'Медеуский', 'Горная резиденция «Көкжайлау», дом 7',
    43.16, 77.06, 180, 25, 3.5, 20000, 150000, 4,
    '{https://picsum.photos/seed/lokacia60/800/600,https://picsum.photos/seed/lokacia61/800/600,https://picsum.photos/seed/lokacia62/800/600}',
    '{rustic,modern}',
    '{Панорамный вид,Камин,Терраса 50м²,3 спальни,Кухня,Парковка,Wi-Fi,Генератор}',
    '{Тишина после 22:00,Запрет на фейерверки,Уборка за доп. плату 15 000 ₸}',
    true, false, true, false, true, 4.8, 19, false, false, 'active'
  ),
  (
    host_id,
    'Коворкинг HUB — Переговорные от 4 до 20 чел',
    'coworking-hub-meeting-rooms',
    'Современный коворкинг в центре Астаны. 5 переговорных комнат вместимостью от 4 до 20 человек. Каждая оборудована ТВ, маркерными досками, видеоконференцией.',
    'coworking', '{meeting,production}', 'astana', 'Есильский', 'пр. Мәңгілік Ел 35',
    51.128, 71.43, 45, 20, 3, 6000, null, 1,
    '{https://picsum.photos/seed/lokacia70/800/600,https://picsum.photos/seed/lokacia71/800/600,https://picsum.photos/seed/lokacia72/800/600}',
    '{modern,minimalist}',
    '{ТВ / проектор,Маркерные доски,Видеоконференция,Кофе-машина,Wi-Fi,Парковка,Кондиционер}',
    '{Без еды в переговорных,Бронирование от 1 часа}',
    false, false, false, false, false, 4.5, 41, true, false, 'active'
  ),
  (
    host_id,
    'Black Box Studio — Фото и видео',
    'black-box-studio',
    'Чёрная студия 90м² с полной звукоизоляцией. Идеально для предметной съёмки, видеоклипов, подкастов. Оборудование: Godox AD600, LED-панели, зелёный экран.',
    'video_studio', '{production}', 'almaty', 'Бостандыкский', 'ул. Розыбакиева 247',
    43.228, 76.929, 90, 12, 4, 10000, 65000, 2,
    '{https://picsum.photos/seed/lokacia80/800/600,https://picsum.photos/seed/lokacia81/800/600,https://picsum.photos/seed/lokacia82/800/600}',
    '{modern,industrial}',
    '{Звукоизоляция,Зелёный экран,LED-панели,Godox оборудование,Гримёрная,Костюмерная,Wi-Fi,Кондиционер}',
    '{Обувь снимать,Своё оборудование — по согласованию,Не более 12 человек}',
    false, true, false, false, false, 4.9, 56, true, true, 'active'
  ),
  (
    host_id,
    'Терраса «Высота» — Open-air ивенты',
    'terrasa-vysota-openair',
    'Открытая терраса на крыше ТЦ с видом на горы Алатау. 250м² под открытым небом + крытая зона 80м². Подходит для летних вечеринок, презентаций, свадебных церемоний.',
    'outdoor', '{event,production,leisure}', 'almaty', 'Медеуский', 'пр. Достык 89, крыша',
    43.243, 76.955, 330, 120, null, 30000, 200000, 3,
    '{https://picsum.photos/seed/lokacia90/800/600,https://picsum.photos/seed/lokacia91/800/600,https://picsum.photos/seed/lokacia92/800/600}',
    '{modern}',
    '{Вид на горы,Бар,DJ-пульт,Освещение,Крытая зона 80м²,Парковка,Wi-Fi}',
    '{Сезон: май-сентябрь,Окончание до 23:00,Залог 150 000 ₸}',
    true, true, false, true, true, 4.7, 38, false, false, 'active'
  );

END $$;
