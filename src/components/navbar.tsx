"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { isAdmin, getUnreadCount } from "@/lib/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      isAdmin(user.id).then(setAdmin);
      getUnreadCount(user.id).then(setUnread);
    } else {
      setAdmin(false);
      setUnread(0);
    }
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
              <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" fill="currentColor" />
              <path
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                stroke="currentColor"
                strokeWidth={1.5}
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">
            LOKACIA<span className="text-primary">.KZ</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/catalog" className="hover:text-primary transition-colors">
            Каталог
          </Link>
          <Link href="/#how" className="hover:text-primary transition-colors">
            Как это работает
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Inbox icon — always visible */}
              <Link
                href="/inbox"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full">
                    {unread}
                  </span>
                )}
              </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:shadow-md transition-shadow"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <div className="relative w-7 h-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.name} fill className="object-cover" sizes="28px" />
                  ) : (
                    <span className="text-xs font-bold text-primary">{user.name[0]}</span>
                  )}
                </div>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-semibold text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    {user.role === "host" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Мои локации
                      </Link>
                    )}
                    <Link
                      href="/inbox"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Сообщения
                      {unread > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {unread}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Бронирования
                    </Link>
                    {admin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-purple-600 hover:bg-gray-50"
                      >
                        Админ-панель
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Регистрация
              </Link>
              <Link
                href="/#form"
                className="hidden sm:inline-flex bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Разместить
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
