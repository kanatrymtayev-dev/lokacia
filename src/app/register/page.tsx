"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { validatePassword } from "@/lib/validate-password";
import Navbar from "@/components/navbar";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"host" | "renter">("host");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const passwordErrors = validatePassword(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(". "));
      return;
    }

    setLoading(true);
    const result = await register({ name, email, phone, password, role });
    setLoading(false);
    if (result.ok) {
      setEmailSent(true);
    } else {
      setError(result.error || "Ошибка регистрации");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Регистрация</h1>
            <p className="mt-2 text-gray-600">
              Создайте аккаунт чтобы сдавать или арендовать локации
            </p>
          </div>

          {emailSent ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-bold">Подтвердите email</h3>
              <p className="mt-2 text-sm text-gray-600">
                Мы отправили письмо на <strong>{email}</strong>. Нажмите на ссылку в письме чтобы активировать аккаунт.
              </p>
              <p className="mt-4 text-xs text-gray-400">
                Не получили письмо? Проверьте папку «Спам».
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-primary text-sm font-medium hover:underline"
              >
                Перейти к входу
              </Link>
            </div>
          ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5"
          >
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            {/* Role toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Что хотите делать в первую очередь?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("host")}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    role === "host"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Сдавать помещение
                </button>
                <button
                  type="button"
                  onClick={() => setRole("renter")}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                    role === "renter"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Арендовать локацию
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Имя *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Канат"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="reg-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон *
              </label>
              <input
                type="tel"
                id="reg-phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 777 123 4567"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль *
              </label>
              <input
                type="password"
                id="reg-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
              {password.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {([
                    { test: password.length >= 8, label: "Минимум 8 символов" },
                    { test: /[A-ZА-ЯЁ]/.test(password), label: "Заглавная буква" },
                    { test: /\d/.test(password), label: "Цифра" },
                    { test: /[!@#$%^&*()_+\-=]/.test(password), label: "Спецсимвол (!@#$%^&*)" },
                  ] as const).map(({ test, label }) => (
                    <li key={label} className={`flex items-center gap-1.5 ${test ? "text-green-600" : "text-gray-400"}`}>
                      {test ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-gray-600">
                Я принимаю{" "}
                <Link href="/terms" target="_blank" className="text-primary hover:underline">Правила платформы</Link>
                {" "}и{" "}
                <Link href="/privacy" target="_blank" className="text-primary hover:underline">Политику конфиденциальности</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !termsAccepted}
              className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Войти
              </Link>
            </p>
          </form>
          )}
        </div>
      </main>
    </div>
  );
}
