import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata = {
  title: "Программа защиты — LOKACIA.KZ",
  description: "Залоговый депозит, гарантийный фонд и система претензий для безопасной аренды площадок.",
};

export default function ProtectionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.661 2.237a1 1 0 0 1 .678 0l6 2.18a1 1 0 0 1 .661.94v4.157c0 3.579-2.297 6.74-5.72 7.986a1 1 0 0 1-.56 0C7.297 16.254 5 13.093 5 9.514V5.357a1 1 0 0 1 .661-.94l4-1.18Zm.839 7.263a.75.75 0 1 0-1-1.118L7.88 9.86l-.38-.38a.75.75 0 0 0-1.06 1.06l.91.91a.75.75 0 0 0 1.08.03l2.07-1.98Z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Программа защиты LOKACIA
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Мы заботимся о безопасности хостов и арендаторов. Залоговый депозит, гарантийный фонд и прозрачная система претензий.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-center mb-12">Как это работает</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Deposit */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Залоговый депозит</h3>
                <p className="text-sm text-gray-600">
                  Хост устанавливает сумму залога для своей площадки. Депозит блокируется при бронировании и возвращается арендатору через 48 часов после завершения, если нет повреждений.
                </p>
              </div>

              {/* Guarantee fund */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.661 2.237a1 1 0 0 1 .678 0l6 2.18a1 1 0 0 1 .661.94v4.157c0 3.579-2.297 6.74-5.72 7.986a1 1 0 0 1-.56 0C7.297 16.254 5 13.093 5 9.514V5.357a1 1 0 0 1 .661-.94l4-1.18Z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Гарантийный фонд</h3>
                <p className="text-sm text-gray-600">
                  Покрытие до 500 000 тг за инцидент. Фонд формируется из сервисного сбора платформы и покрывает случаи, когда залог недостаточен.
                </p>
              </div>

              {/* Claims */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Система претензий</h3>
                <p className="text-sm text-gray-600">
                  Хост может подать претензию в течение 48 часов после завершения бронирования с фото повреждений. Команда LOKACIA рассмотрит и примет решение.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Covered */}
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
                  </svg>
                  Что покрывается
                </h2>
                <ul className="space-y-3">
                  {[
                    "Повреждение мебели и предметов интерьера",
                    "Повреждение оборудования (освещение, звук, техника)",
                    "Повреждение отделки (полы, стены, потолки)",
                    "Кража предметов из помещения",
                    "Повреждение сантехники",
                    "Порча текстиля (шторы, ковры, обивка)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Not covered */}
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd"/>
                  </svg>
                  Что НЕ покрывается
                </h2>
                <ul className="space-y-3">
                  {[
                    "Естественный износ помещения и мебели",
                    "Мелкие косметические дефекты (царапины, потёртости)",
                    "Повреждения, вызванные форс-мажором (стихийные бедствия)",
                    "Упущенная выгода или потеря дохода",
                    "Повреждения за пределами арендуемого помещения",
                    "Повреждения, не зафиксированные фото/видео",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How to file a claim */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-center mb-12">Как подать претензию</h2>
            <div className="space-y-6">
              {[
                { step: "1", title: "Сделайте фото до и после", desc: "Перед передачей площадки арендатору сфотографируйте состояние. После завершения бронирования — сделайте повторные фото." },
                { step: "2", title: "Подайте заявку в дашборде", desc: "В панели хоста на карточке бронирования нажмите «Претензия». Опишите повреждения, укажите сумму ущерба и приложите фото." },
                { step: "3", title: "Рассмотрение командой LOKACIA", desc: "Мы рассмотрим вашу претензию, изучим фото и переписку. Срок рассмотрения — до 5 рабочих дней." },
                { step: "4", title: "Решение и компенсация", desc: "По результатам проверки: удержание залога, выплата из гарантийного фонда или отклонение претензии с объяснением причины." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-center mb-10">Частые вопросы</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Кто оплачивает залоговый депозит?",
                  a: "Залог оплачивает арендатор при бронировании. Сумму залога устанавливает хост в настройках площадки. Если хост не установил залог — он равен нулю."
                },
                {
                  q: "Когда возвращается залог?",
                  a: "Залог возвращается арендатору автоматически через 48 часов после завершения бронирования, если хост не подал претензию."
                },
                {
                  q: "Что если ущерб превышает сумму залога?",
                  a: "В этом случае разница может быть покрыта из гарантийного фонда LOKACIA (до 500 000 тг за инцидент). Решение принимает команда платформы после рассмотрения претензии."
                },
                {
                  q: "Нужно ли хосту иметь собственное помещение?",
                  a: "Хост должен иметь право сдавать площадку в аренду — быть собственником или иметь договор субаренды, разрешающий краткосрочную аренду третьим лицам."
                },
              ].map((item) => (
                <div key={item.q} className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900">{item.q}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
