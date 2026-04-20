import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata = {
  title: "Политика конфиденциальности — LOKACIA.KZ",
  description: "Политика конфиденциальности маркетплейса аренды локаций LOKACIA.KZ.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Политика конфиденциальности
            </h1>
            <p className="mt-4 text-sm text-gray-500">Последнее обновление: 20 апреля 2026 г.</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Какие данные мы собираем</h2>
            <p className="text-gray-600 leading-relaxed">При использовании LOKACIA.KZ мы можем собирать следующие данные:</p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Личные данные: имя, email, номер телефона, аватар</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Данные верификации: фото удостоверения личности, селфи (для хостов)</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Данные бронирований: даты, суммы, история взаимодействий</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Данные компании: БИН, название, юридический адрес (для B2B-инвойсов)</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Технические данные: IP-адрес, тип браузера, cookies</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Переписка: сообщения между хостами и арендаторами через встроенный чат</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Как мы используем данные</h2>
            <p className="text-gray-600 leading-relaxed">Собранные данные используются для:</p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Предоставления услуг платформы: регистрация, бронирование, оплата</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Верификации личности хостов и обеспечения безопасности</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Уведомлений: подтверждения бронирований, новые сообщения, изменения статуса</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Улучшения сервиса: аналитика, оптимизация, устранение ошибок</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Формирования PDF-инвойсов и актов для B2B-клиентов</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Разрешения споров между участниками платформы</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Хранение данных</h2>
            <p className="text-gray-600 leading-relaxed">
              Данные пользователей хранятся в облачной базе данных Supabase (серверы в ЕС)
              с шифрованием при передаче (TLS) и хранении (AES-256). Документы верификации
              хранятся в защищённом облачном хранилище с ограниченным доступом. Данные
              хранятся в течение всего срока действия аккаунта и 12 месяцев после его
              удаления (для целей бухгалтерского учёта и разрешения споров).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Мы используем cookies для аутентификации (сессионные cookies Supabase),
              запоминания языковых предпочтений и сбора аналитики. Вы можете отключить
              cookies в настройках браузера, однако это может ограничить функциональность
              сервиса (например, потребуется повторный вход при каждом визите).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Передача данных третьим лицам</h2>
            <p className="text-gray-600 leading-relaxed">
              Мы не продаём и не передаём ваши персональные данные третьим лицам, за
              исключением следующих случаев:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Платёжные провайдеры — для обработки транзакций</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Хосты/арендаторы — контактные данные после подтверждения бронирования</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Государственные органы — по запросу в соответствии с законодательством РК</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Email-провайдер (Resend) — для отправки уведомлений</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Ваши права</h2>
            <p className="text-gray-600 leading-relaxed">Вы имеете право:</p>
            <ul className="mt-3 space-y-2 text-gray-600">
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Запросить копию всех ваших данных, хранящихся на Платформе</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Потребовать исправления неточных данных</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Потребовать удаления вашего аккаунта и всех связанных данных</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Отозвать согласие на обработку данных (это прекратит действие аккаунта)</li>
              <li className="flex gap-2"><span className="text-primary mt-1">•</span>Подать жалобу в уполномоченный орган по защите персональных данных РК</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Безопасность</h2>
            <p className="text-gray-600 leading-relaxed">
              Мы принимаем разумные технические и организационные меры для защиты ваших
              данных: шифрование при передаче и хранении, ограничение доступа сотрудников,
              регулярные аудиты безопасности, двухфакторная аутентификация для
              административного доступа.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Изменения политики</h2>
            <p className="text-gray-600 leading-relaxed">
              Мы можем обновлять настоящую Политику. О существенных изменениях вы будете
              уведомлены по email. Актуальная версия всегда доступна на этой странице.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-200 text-sm text-gray-500">
            По вопросам конфиденциальности обращайтесь:{" "}
            <a href="mailto:hello@lokacia.kz" className="text-primary hover:underline">
              hello@lokacia.kz
            </a>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
