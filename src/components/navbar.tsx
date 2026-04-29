"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useT, type Lang } from "@/lib/i18n";
import { isAdmin, getUnreadCount, getUnreadNotificationCount, getFavoriteIds } from "@/lib/api";

const browseCategoryTypes = [
  "photo_studio", "video_studio", "banquet_hall", "apartment", "sound_stage",
  "ethno", "restaurant", "office", "chalet", "loft",
];

const languages: { code: Lang; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "kz", label: "KZ" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useT();
  const [mounted, setMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const browseRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      isAdmin(user.id).then(setAdmin);
      Promise.all([getUnreadCount(user.id), getUnreadNotificationCount(user.id)])
        .then(([msgs, notifs]) => setUnread(msgs + notifs));
      getFavoriteIds(user.id).then((s) => setFavoritesCount(s.size));
    } else {
      setAdmin(false);
      setUnread(0);
      setFavoritesCount(0);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) setBrowseOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function changeLang(code: Lang) {
    setLang(code);
    setLangOpen(false);
  }

  const listSpaceHref = user ? "/dashboard" : "/register";

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
        : "bg-transparent border-b border-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo + Nav links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center hover:rotate-6 transition-transform">
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

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {/* Browse Locations dropdown */}
            <div ref={browseRef} className="relative">
              <button
                onClick={() => { setBrowseOpen(!browseOpen); setLangOpen(false); setProfileOpen(false); }}
                className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors"
              >
                {t("nav.browse")}
                <svg className={`w-4 h-4 transition-transform ${browseOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {browseOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                  {browseCategoryTypes.map((type) => (
                    <Link
                      key={type}
                      href={`/catalog?type=${type}`}
                      onClick={() => setBrowseOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      {t(`cat.${type}`)}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      href="/catalog"
                      onClick={() => setBrowseOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    >
                      {t("nav.allLocations")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* List Your Space */}
            <Link
              href={listSpaceHref}
              className="text-gray-700 hover:text-primary transition-colors"
            >
              {t("nav.list")}
            </Link>
          </div>
        </div>

        {/* Right: Language + Auth */}
        <div className="flex items-center gap-2">
          {/* Language switcher — desktop */}
          <div ref={langRef} className="relative hidden sm:block">
            <button
              onClick={() => { setLangOpen(!langOpen); setBrowseOpen(false); setProfileOpen(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              {lang.toUpperCase()}
              <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-24 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      lang === l.code
                        ? "text-primary font-semibold bg-primary/5"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {mounted && user ? (
            <>
              {/* Favorites icon */}
              <Link
                href="/favorites"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-500"
                aria-label="Избранное"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              {/* Inbox icon */}
              <Link
                href="/inbox"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full">
                    {unread}
                  </span>
                )}
              </Link>

              {/* Profile avatar dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => { setProfileOpen(!profileOpen); setBrowseOpen(false); setLangOpen(false); }}
                  className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all"
                >
                  {user.avatar_url && typeof user.avatar_url === 'string' && user.avatar_url.trim() !== '' ? (
                    <Image src={user.avatar_url} alt={user.name} fill className="object-cover" sizes="36px" />
                  ) : (
                    <span className="text-sm font-bold text-primary">{user.name[0]}</span>
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-semibold text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("nav.profile")}
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Панель хоста
                    </Link>
                    <Link
                      href="/inbox"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("nav.messages")}
                      {unread > 0 && (
                        <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {unread}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("nav.bookings")}
                    </Link>
                    <Link
                      href="/favorites"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("nav.favorites")}
                      {favoritesCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>
                    {admin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-purple-600 hover:bg-gray-50"
                      >
                        {t("nav.admin")}
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href={listSpaceHref}
                className="hidden sm:inline-flex bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {t("nav.register")}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Меню"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — slide-in overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden animate-[fadeIn_200ms_ease-out]"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-xl lg:hidden overflow-y-auto animate-[slideInRight_250ms_ease-out]">
            {/* Close button */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">Меню</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4 space-y-1">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                {t("nav.browse")}
              </div>
              {browseCategoryTypes.map((type) => (
                <Link
                  key={type}
                  href={`/catalog?type=${type}`}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                >
                  {t(`cat.${type}`)}
                </Link>
              ))}
              <Link
                href="/catalog"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                Все локации
              </Link>
              <div className="border-t border-gray-100 my-3" />
              <Link
                href={listSpaceHref}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
              >
                {t("nav.list")}
              </Link>
              <div className="border-t border-gray-100 my-3" />
              <div className="flex gap-2 px-3 py-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      lang === l.code
                        ? "bg-primary text-white font-semibold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
