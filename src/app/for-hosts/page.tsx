import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata = {
  title: "Для хостов — Зарабатывайте на LOKACIA.KZ",
  description: "Сдавайте ваше помещение на маркетплейсе LOKACIA.KZ. Бесплатное размещение, комиссия 15%, тысячи арендаторов.",
};

const steps = [
  { num: "01", title: "Зарегистрируйтесь", desc: "Создайте аккаунт хоста за 1 минуту. Никаких документов на старте." },
  { num: "02", title: "Добавьте локацию", desc: "Загрузите фото, опишите площадку, укажите цену и правила." },
  { num: "03", title: "Получайте запросы", desc: "Арендаторы находят вас через каталог и отправляют запрос на бронирование." },
  { num: "04", title: "Зарабатывайте", desc: "Подтвердите бронирование — деньги поступают на ваш счёт после мероприятия." },
];

const benefits = [
  { title: "Бесплатное размещение", desc: "Вы платите только когда зарабатываете. Никаких абонентских плат." },
  { title: "0% первые 3 месяца", desc: "Комиссия 15% — одна из самых низких на рынке. Первые 3 месяца после регистрации — бесплатно." },
  { title: "Верификация и доверие", desc: "Пройдите ID-верификацию — и получите зелёный бейдж, повышающий конверсию." },
  { title: "Аналитика", desc: "Отслеживайте просмотры, бронирования, выручку и конверсию в дашборде." },
  { title: "PDF-инвойсы", desc: "Автоматическая генерация счетов для B2B-клиентов." },
  { title: "Чат и уведомления", desc: "Общайтесь с арендаторами прямо на платформе. Email-уведомления о каждом запросе." },
];

const earnings = [
  { type: "Фотостудия", amount: "~800K", period: "в месяц / 4 бронирования в день" },
  { type: "Ивент-площадка", amount: "~1.2M", period: "в месяц / 8 мероприятий" },
  { type: "Квартира для съёмок", amount: "~300K", period: "в месяц / 10 съёмок" },
];

export default function ForHostsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-violet-950 to-purple-900 text-white py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Зарабатывайте
                <br />
                <span className="text-amber-400">на вашем пространстве</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-violet-200 leading-relaxed max-w-2xl">
                Сдавайте студию, лофт, ресторан, загородный дом или любое другое помещение —
                и получайте доход без лишних хлопот.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register?role=host"
                  className="inline-flex items-center justify-center bg-amber-400 text-gray-900 px-8 py-4 rounded-full text-base font-bold hover:bg-amber-300 transition-colors shadow-lg"
                >
                  Стать хостом
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/#how"
                  className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/20 transition-colors border border-white/20"
                >
                  Как это работает
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                4 шага до первого дохода
              </h2>
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
        <section className="py-20 sm:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Почему хосты выбирают LOKACIA
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Earnings calculator */}
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
                  {earnings.map((e) => (
                    <div key={e.type} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <div className="text-sm text-violet-300 mb-2">{e.type}</div>
                      <div className="text-3xl font-bold text-amber-400">{e.amount} &#8376;</div>
                      <div className="text-sm text-violet-400 mt-1">{e.period}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-violet-400">
                  * После вычета комиссии 15%. Реальный доход зависит от локации, цен и загрузки.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
              Набираем первых 100 хостов
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Начните зарабатывать сегодня
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Первые 3 месяца — <span className="font-bold text-primary">0% комиссии</span>. Регистрируйтесь и начните получать бронирования бесплатно
            </p>
            <div className="mt-8">
              <Link
                href="/register?role=host"
                className="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-full text-base font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                Зарегистрироваться как хост
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
