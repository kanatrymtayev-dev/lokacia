"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/navbar";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"host" | "renter">("host");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await register({ name, email, phone, password, role });
    setLoading(false);
    router.push(role === "host" ? "/dashboard" : "/catalog");
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

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5"
          >
            {/* Role toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Я хочу</label>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
        </div>
      </main>
    </div>
  );
}
