import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AnimatedSection from "@/components/animated-section";
import { WaveDivider } from "@/components/illustrations";

export const metadata = {
  title: "Для хостов — Зарабатывайте на LOKACIA.KZ",
  description: "Сдавайте ваше помещение на маркетплейсе LOKACIA.KZ. 0% комиссии, безопасная оплата, тысячи арендаторов.",
};

const steps = [
  { num: "01", title: "Зарегистрируйтесь", desc: "Создайте аккаунт хоста за 1 минуту. Никаких документов на старте.", note: "← 1 минута!" },
  { num: "02", title: "Добавьте локацию", desc: "Загрузите фото, опишите площадку, укажите цену и правила.", note: "бесплатно ✓" },
  { num: "03", title: "Получайте запросы", desc: "Арендаторы находят вас через каталог и отправляют запрос на бронирование.", note: "без звонков!" },
  { num: "04", title: "Зарабатывайте", desc: "Подтвердите бронирование — деньги поступают на ваш счёт после мероприятия.", note: "быстрая выплата →" },
];

const benefits = [
  { title: "0% комиссии", desc: "Вы получаете полную сумму бронирования. Без скрытых платежей и абонентских плат." },
  { title: "Безопасная оплата", desc: "Онлайн-оплата через платформу. Когда арендатор оплачивает — деньги гарантированы." },
  { title: "Верификация и доверие", desc: "Пройдите ID-верификацию — и получите зелёный бейдж, повышающий конверсию." },
  { title: "Аналитика", desc: "Отслеживайте просмотры, бронирования, выручку и конверсию в дашборде." },
  { title: "PDF-инвойсы", desc: "Автоматическая генерация счетов для B2B-клиентов." },
  { title: "Чат и уведомления", desc: "Общайтесь с арендаторами прямо на платформе. Email-уведомления о каждом запросе." },
];

export default function ForHostsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero — dark */}
        <section className="bg-dark text-white py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Зарабатывайте
                <br />
                <span className="bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">на вашем пространстве</span>
              </h1>
              <p className="font-handwritten text-xl text-accent/70 mt-2 -rotate-1">и это проще, чем кажется!</p>
              <p className="mt-6 text-lg sm:text-xl text-dark-text/80 leading-relaxed max-w-2xl">
                Сдавайте студию, лофт, ресторан, загородный дом или любое другое помещение —
                и получайте доход без лишних хлопот.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register?role=host"
                  className="inline-flex items-center justify-center bg-accent text-gray-900 px-8 py-4 rounded-full text-base font-bold hover:bg-amber-300 transition-all active:scale-[0.97] shadow-lg"
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

        <div className="bg-dark -mt-1">
          <WaveDivider fill="var(--background)" />
        </div>

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
                <AnimatedSection key={step.num} delay={`${i * 120}ms`}>
                  <div className="relative">
                    {i < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-x-4" />
                    )}
                    <div className="text-6xl font-black text-primary/10">{step.num}</div>
                    <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-gray-600 leading-relaxed">{step.desc}</p>
                    <p className="font-handwritten text-lg text-primary mt-2 -rotate-1">{step.note}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 sm:py-28 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Почему хосты выбирают LOKACIA
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <AnimatedSection key={b.title} delay={`${i * 100}ms`}>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — dark */}
        <section className="py-20 sm:py-28 bg-dark text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1),transparent_70%)]" />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm font-semibold mb-4 border border-accent/20">
              Набираем первых 100 хостов
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Начните зарабатывать <span className="text-accent">сегодня</span>
            </h2>
            <p className="mt-4 text-lg text-dark-muted">
              Первые 30 дней — <span className="font-bold text-accent">0% комиссии</span>. Регистрируйтесь и начните получать бронирования бесплатно
            </p>
            <p className="font-handwritten text-xl text-rose mt-2 -rotate-1">да, совсем бесплатно!</p>
            <div className="mt-8">
              <Link
                href="/register?role=host"
                className="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-full text-base font-bold hover:bg-primary-light transition-all active:scale-[0.97] shadow-lg shadow-primary/25"
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
