import HostForm from "./host-form";

const categories = [
  {
    title: "Фотостудии",
    desc: "Циклорамы, daylight-студии, оборудование",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
      </svg>
    ),
  },
  {
    title: "Ивент-площадки",
    desc: "Банкетные залы, лофты, open-air",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
  },
  {
    title: "Жильё для съёмок",
    desc: "Квартиры, дома, виллы, коттеджи",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    title: "Sound Stages",
    desc: "Павильоны для кино и видеопродакшн",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: "Этно-пространства",
    desc: "Юрты, казахские гостевые дома",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
  },
  {
    title: "Рестораны и кафе",
    desc: "Для корпоративов, тоев и вечеринок",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    title: "Переговорные",
    desc: "Офисы, коворкинги, конференц-залы",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    ),
  },
  {
    title: "Горные шале",
    desc: "Уникальные площадки в горах Алматы",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
      </svg>
    ),
  },
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

const steps = [
  { num: "01", title: "Разместите", desc: "Добавьте фото, описание, цену и правила вашего помещения" },
  { num: "02", title: "Получите запрос", desc: "Арендаторы находят вас через поиск и отправляют запрос" },
  { num: "03", title: "Подтвердите", desc: "Примите бронирование — деньги замораживаются на escrow" },
  { num: "04", title: "Зарабатывайте", desc: "После мероприятия деньги поступают вам на Kaspi за 3-5 дней" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" fill="currentColor" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" stroke="currentColor" strokeWidth={1.5} />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              LOKACIA<span className="text-primary">.KZ</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#categories" className="hover:text-primary transition-colors">Категории</a>
            <a href="#how" className="hover:text-primary transition-colors">Как это работает</a>
            <a href="#benefits" className="hover:text-primary transition-colors">Преимущества</a>
          </div>
          <a
            href="#form"
            className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Разместить локацию
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Запуск в Алматы — набираем первых хостов
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Сдавайте помещение.
              <br />
              <span className="text-amber-400">Зарабатывайте.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-violet-200 max-w-2xl leading-relaxed">
              LOKACIA — маркетплейс аренды локаций для съёмок, мероприятий и встреч
              в&nbsp;Казахстане. Как Giggster, только для нас.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#form"
                className="inline-flex items-center justify-center bg-accent text-gray-900 px-8 py-4 rounded-full text-base font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/25"
              >
                Хочу сдавать помещение
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="#categories"
                className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Ищу локацию
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
              >
                <div className="text-3xl sm:text-4xl font-bold text-accent">{s.value}</div>
                <div className="mt-1 text-sm text-violet-300">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Любое пространство для любой задачи
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              От фотостудий до горных шале — размещайте и находите локации любого типа
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{cat.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Как начать зарабатывать
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              4 простых шага — от размещения до первых денег на Kaspi
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-x-4" />
                )}
                <div className="text-5xl font-black text-primary/10">{step.num}</div>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Почему LOKACIA
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-2xl p-8 border border-gray-200"
              >
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
            ))}
          </div>
        </div>
      </section>

      {/* Earning calculator */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-violet-950 to-purple-900 rounded-3xl p-8 sm:p-12 lg:p-16 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Сколько можно заработать?
              </h2>
              <p className="mt-4 text-violet-300 text-lg">
                Примерный доход для Алматы при средней загрузке
              </p>
              <div className="mt-10 grid sm:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-sm text-violet-300 mb-2">Фотостудия</div>
                  <div className="text-3xl font-bold text-accent">~800K ₸</div>
                  <div className="text-sm text-violet-400 mt-1">в месяц / 4 бронирования в день</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-sm text-violet-300 mb-2">Ивент-площадка</div>
                  <div className="text-3xl font-bold text-accent">~1.2M ₸</div>
                  <div className="text-sm text-violet-400 mt-1">в месяц / 8 мероприятий</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-sm text-violet-300 mb-2">Квартира для съёмок</div>
                  <div className="text-3xl font-bold text-accent">~300K ₸</div>
                  <div className="text-sm text-violet-400 mt-1">в месяц / 10 съёмок</div>
                </div>
              </div>
              <p className="mt-6 text-sm text-violet-400">
                * После вычета комиссии платформы 15%. Реальный доход зависит от локации, цен и загрузки.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Form */}
      <section id="form" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                Набираем первых 100 хостов
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Оставьте заявку — запустим вместе
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Первые 100 хостов получают <span className="font-bold text-primary">0% комиссии на 6 месяцев</span> + бесплатную профессиональную фотосъёмку помещения
              </p>
            </div>
            <HostForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                  <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" fill="currentColor" />
                  <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" stroke="currentColor" strokeWidth={1.5} />
                </svg>
              </div>
              <span className="text-white font-bold">LOKACIA.KZ</span>
            </div>
            <p className="text-sm">
              Маркетплейс аренды локаций для съёмок, мероприятий и встреч в Казахстане
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} LOKACIA.KZ. Все права защищены. Алматы, Казахстан.
          </div>
        </div>
      </footer>
    </div>
  );
}
