"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/navbar";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError("Неверный email или пароль");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Вход в LOKACIA</h1>
            <p className="mt-2 text-gray-600">
              Войдите чтобы управлять локациями или бронированиями
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5"
          >
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Входим..." : "Войти"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Зарегистрироваться
              </Link>
            </p>

            {/* Demo credentials */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 text-center mb-3">Демо-аккаунты для тестирования:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail("host@lokacia.kz"); setPassword("host123"); }}
                  className="text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-600 transition-colors"
                >
                  Хост: host@lokacia.kz
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("renter@lokacia.kz"); setPassword("renter123"); }}
                  className="text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-600 transition-colors"
                >
                  Арендатор: renter@lokacia.kz
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
