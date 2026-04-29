import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ListingCard from "@/components/listing-card";
import HeroSearch from "@/components/hero-search";
import FaqAccordion from "@/components/faq-accordion";
import { getListings } from "@/lib/api";
import HostForm from "./host-form";
import { HeroText, SectionTitle, T } from "./home-sections";
import AnimatedSection from "@/components/animated-section";
import CountUp from "@/components/count-up";
import StickySteps from "@/components/sticky-steps";
import { HeroDecor, WaveDivider, IllustrationCamera, IllustrationParty, IllustrationHouse, IllustrationFilm, IllustrationYurt, IllustrationCutlery, IllustrationDesk, IllustrationMountain } from "@/components/illustrations";

const testimonials = [
  {
    name: "Алия К.",
    role: "Арендатор",
    text: "Нашла идеальную студию для фотосъёмки за 10 минут. Раньше обзванивала по 20 номеров. LOKACIA — это спасение!",
    rating: 5,
  },
  {
    name: "Марат Т.",
    role: "Хост, фотостудия",
    text: "За первый месяц получил 12 бронирований. Платформа сама приводит клиентов, мне остаётся только подтверждать.",
    rating: 5,
  },
  {
    name: "Динара С.",
    role: "Ивент-менеджер",
    text: "Удобно сравнивать площадки, смотреть отзывы и бронировать без звонков. Для корпоративов — самое то, PDF-инвойс сразу для бухгалтерии.",
    rating: 5,
  },
];

const homeFaqs = [
  { q: "Как разместить площадку?", a: "Зарегистрируйтесь как хост, нажмите «Разместить площадку», заполните описание, добавьте фото и укажите цену. Публикация бесплатная." },
  { q: "Сколько стоит размещение?", a: "Размещение бесплатное. Платформа берёт комиссию 15% только с успешных бронирований. Если приводите своего клиента — всего 3%." },
  { q: "Как забронировать локацию?", a: "Выберите площадку, укажите дату, время и количество гостей, отправьте запрос. Хост подтвердит — и готово." },
  { q: "Можно ли отменить бронирование?", a: "Да. Полный возврат за 48+ часов, частичный за 24-48 часов. Точные условия зависят от политики хоста." },
  { q: "Нужно ли быть юрлицом?", a: "Нет. И хосты, и арендаторы могут работать как физлица. Юр. данные нужны только для PDF-инвойсов." },
  { q: "Как связаться с поддержкой?", a: "Напишите на hello@lokacia.kz — мы отвечаем в течение 24 часов." },
];

const categoryIllustrations = [
  <IllustrationCamera key="cam" className="w-10 h-10" />,
  <IllustrationParty key="party" className="w-10 h-10" />,
  <IllustrationHouse key="house" className="w-10 h-10" />,
  <IllustrationFilm key="film" className="w-10 h-10" />,
  <IllustrationYurt key="yurt" className="w-10 h-10" />,
  <IllustrationCutlery key="cutlery" className="w-10 h-10" />,
  <IllustrationDesk key="desk" className="w-10 h-10" />,
  <IllustrationMountain key="mountain" className="w-10 h-10" />,
];

const categories = [
  { title: "Фотостудии", desc: "Циклорамы, daylight-студии, оборудование", image: "/images/categories/photo-studio.webp" },
  { title: "Ивент-площадки", desc: "Банкетные залы, лофты, open-air", image: "/images/categories/event-space.webp" },
  { title: "Жильё для съёмок", desc: "Квартиры, дома, виллы, коттеджи", image: "/images/categories/apartment.webp" },
  { title: "Sound Stages", desc: "Павильоны для кино и видеопродакшн", image: "/images/categories/sound-stage.webp" },
  { title: "Этно-пространства", desc: "Юрты, казахские гостевые дома", image: "/images/categories/ethno-space.webp" },
  { title: "Рестораны и кафе", desc: "Для корпоративов, тоев и вечеринок", image: "/images/categories/restaurant.webp" },
  { title: "Переговорные", desc: "Офисы, коворкинги, конференц-залы", image: "/images/categories/meeting-room.webp" },
  { title: "Горные шале", desc: "Уникальные площадки в горах Алматы", image: "/images/categories/mountain-chalet.webp" },
];

const benefits = [
  {
    title: "Для хостов",
    items: [
      "Бесплатное размещение — платите только с бронирований",
      "Комиссия всего 15% (ниже рынка)",
      "Приводите своих клиентов — комиссия 3%",
      "Гибкие цены по типу активности и дню недели",
      "Автогенерация договоров на русском и казахском",
      "Встроенная защита: страхование + залог + escrow",
    ],
  },
  {
    title: "Для арендаторов",
    items: [
      "Удобный поиск с фильтрами и картой 2GIS",
      "Мгновенное бронирование без звонков",
      "Оплата через Kaspi Pay в 1 клик",
      "Страхование и защита на каждом бронировании",
      "Реальные отзывы и рейтинги",
      "AI-подбор: опишите что нужно — найдём за вас",
    ],
  },
];

const stats = [
  { value: "500+", label: "Продакшн-компаний в Алматы" },
  { value: "115K", label: "Свадеб в год в Казахстане" },
  { value: "514", label: "Фильмов снято в 2024" },
  { value: "93%", label: "Казахстанцев онлайн" },
];


export const revalidate = 60;

export default async function Home() {
  const listings = await getListings();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero — Dark cinematic */}
      <section className="relative overflow-hidden text-white bg-dark min-h-[90vh] flex items-center">
        {/* Background image with dark overlay */}
        <Image
          src="/images/hero.webp"
          alt="LOKACIA — площадки для съёмок и мероприятий в Казахстане"
          fill
          className="object-cover opacity-30"
          priority
          quality={85}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/40 to-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.08),transparent_50%)]" />

        {/* Hand-drawn decorative doodles — larger */}
        <HeroDecor />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Маркетплейс аренды локаций в Казахстане
            </div>

            {/* Main headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Найди свою
              <br />
              <span className="bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">сцену</span>
            </h1>

            {/* Handwritten annotation */}
            <p className="font-handwritten text-2xl text-accent/80 mt-3 -rotate-2">
              ← для съёмок, мероприятий и спорта
            </p>

            <p className="mt-6 text-lg sm:text-xl text-dark-text/80 max-w-2xl mx-auto leading-relaxed">
              Площадки для кино, фотосъёмок, корпоративов, тренировок —
              всё в одном месте. Бронируй за 5 минут.
            </p>

            {/* Free badge */}
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-white/90 border border-white/5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              0% комиссии — бесплатно для хостов и арендаторов
            </div>

            {/* Search bar */}
            <div className="mt-10">
              <HeroSearch />
            </div>
          </div>

          {/* Stats bar with CountUp */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-dark-surface/80 backdrop-blur-sm rounded-2xl p-5 border border-dark-border hover:border-primary/30 transition-colors"
              >
                <CountUp end={s.value} className="text-3xl sm:text-4xl font-bold text-accent" />
                <div className="mt-1 text-sm text-dark-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave: Hero → Categories */}
      <div className="bg-dark -mt-1">
        <WaveDivider fill="var(--cream)" />
      </div>

      {/* Categories */}
      <section id="categories" className="py-20 sm:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle titleKey="home.categories.title" subtitleKey="home.categories.subtitle" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat, i) => (
              <AnimatedSection key={cat.title} animation="fade-in-scale" delay={`${i * 80}ms`}>
                <div className="group relative rounded-2xl overflow-hidden h-56 sm:h-64 cursor-pointer">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-primary/80 group-hover:via-primary/30 transition-all duration-300" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {categoryIllustrations[i]}
                    </div>
                    <h3 className="font-bold text-lg text-white">{cat.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{cat.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      {listings.length > 0 && (
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Популярные локации
                </h2>
                <p className="mt-3 text-lg text-gray-600">
                  Лучшие пространства для ваших проектов
                </p>
              </div>
              <Link
                href="/catalog"
                className="hidden sm:inline-flex items-center gap-1 text-primary font-semibold hover:underline"
              >
                Смотреть все
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.slice(0, 6).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
              >
                Смотреть все локации
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works — with illustrations */}
      <section id="how" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <SectionTitle titleKey="home.howItWorks.title" subtitleKey="home.howItWorks.subtitle" />
            <p className="font-handwritten text-xl text-accent -rotate-1 -mt-8">проще, чем кажется!</p>
          </div>
          <StickySteps />
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 sm:py-28 bg-warm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle titleKey="home.benefits.title" />
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((b, i) => (
              <AnimatedSection key={b.title} delay={`${i * 150}ms`}>
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold mb-6">{b.title}</h3>
                <ul className="space-y-4">
                  {b.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <svg className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Что говорят наши пользователи
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Отзывы хостов и арендаторов о платформе
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name} delay={`${i * 150}ms`}>
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Часто задаваемые вопросы
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ответы на популярные вопросы о платформе
            </p>
          </div>
          <FaqAccordion items={homeFaqs} />
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
            >
              Все вопросы и ответы
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA / Form — dark */}
      <section id="form" className="py-20 sm:py-28 bg-dark text-white relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm font-semibold mb-4 border border-accent/20">
                Набираем первых 100 хостов
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Оставьте заявку —
                <br />
                <span className="text-accent">запустим вместе</span>
              </h2>
              <p className="mt-4 text-lg text-dark-muted">
                Первые 100 хостов получают <span className="font-bold text-accent">0% комиссии на 6 месяцев</span> + бесплатную профессиональную фотосъёмку помещения
              </p>
              <p className="font-handwritten text-xl text-rose mt-2 -rotate-1">да, совсем бесплатно!</p>
            </div>
            <div className="bg-dark-surface rounded-2xl border border-dark-border p-6 sm:p-8">
              <HostForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
