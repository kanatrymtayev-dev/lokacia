"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Неверный email или пароль");
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!email) { setError("Введите email"); return; }
    setError("");
    setLoading(true);

    // Check if email is registered
    const { data: exists } = await supabase.rpc("check_email_exists", { check_email: email });

    if (!exists) {
      setError("Этот email не зарегистрирован. Создайте аккаунт.");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">
              {resetMode ? "Сброс пароля" : "Вход в LOKACIA"}
            </h1>
            <p className="mt-2 text-gray-600">
              {resetMode
                ? "Введите email и мы отправим ссылку для сброса"
                : "Войдите чтобы управлять локациями или бронированиями"}
            </p>
          </div>

          {resetMode ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5">
              {resetSent ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Письмо отправлено</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Проверьте почту <strong>{email}</strong> — мы отправили ссылку для сброса пароля.
                  </p>
                  <button
                    onClick={() => { setResetMode(false); setResetSent(false); }}
                    className="mt-4 text-primary text-sm font-medium hover:underline"
                  >
                    Вернуться к входу
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
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
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? "Отправляем..." : "Сбросить пароль"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResetMode(false); setError(""); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    Вернуться к входу
                  </button>
                </form>
              )}
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
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Пароль
                  </label>
                  <button
                    type="button"
                    onClick={() => { setResetMode(true); setError(""); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Забыли пароль?
                  </button>
                </div>
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
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
