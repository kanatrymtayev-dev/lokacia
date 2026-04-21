"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSiteSettings } from "@/lib/api";
import type { SiteSettings } from "@/lib/api";
import { useT } from "@/lib/i18n";

// Defaults used before settings load (and as fallback)
const DEFAULTS: SiteSettings = {
  site_name: "LOKACIA.KZ",
  site_tagline: "Маркетплейс аренды локаций для съёмок, мероприятий и встреч в Казахстане",
  email: "hello@lokacia.kz",
  phone: "+7 700 123 45 67",
  address: "Алматы, Казахстан",
  instagram: "",
  telegram: "",
  whatsapp: "",
};

export default function Footer() {
  const [s, setS] = useState<SiteSettings>(DEFAULTS);
  const { t } = useT();

  useEffect(() => {
    getSiteSettings().then((data) => {
      if (Object.keys(data).length > 0) setS({ ...DEFAULTS, ...data });
    });
  }, []);

  const platform = [
    { label: t("footer.catalog"), href: "/catalog" },
    { label: t("footer.howItWorks"), href: "/#how" },
    { label: t("footer.listSpace"), href: "/#form" },
  ];
  const companyLinks = [
    { label: t("footer.about"), href: "/about" },
    { label: t("footer.faq"), href: "/faq" },
    { label: t("footer.blog"), href: "/blog" },
  ];
  const legal = [
    { label: t("footer.privacy"), href: "/privacy" },
    { label: t("footer.offer"), href: "/terms" },
    { label: t("footer.terms"), href: "/terms" },
  ];

  const hasInstagram = s.instagram && s.instagram.trim() !== "";
  const hasTelegram = s.telegram && s.telegram.trim() !== "";
  const hasWhatsapp = s.whatsapp && s.whatsapp.trim() !== "";
  const hasSocials = hasInstagram || hasTelegram || hasWhatsapp;

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top: Logo + columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
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
              <span className="text-white text-lg font-bold tracking-tight">
                LOKACIA<span className="text-primary">.KZ</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">{s.site_tagline}</p>

            {/* Socials */}
            {hasSocials && (
              <div className="flex items-center gap-3 mt-5">
                {hasInstagram && (
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary/20 flex items-center justify-center transition-colors group">
                    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
                    </svg>
                  </a>
                )}
                {hasTelegram && (
                  <a href={s.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary/20 flex items-center justify-center transition-colors group">
                    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 1 0 24 12.056A12.01 12.01 0 0 0 11.944 0Zm5.654 7.304-1.95 9.199c-.146.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.579-4.462c.538-.196 1.006.128.804.925Z" />
                    </svg>
                  </a>
                )}
                {hasWhatsapp && (
                  <a href={s.whatsapp.startsWith("http") ? s.whatsapp : `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary/20 flex items-center justify-center transition-colors group">
                    <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Zm-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884Zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t("footer.platform")}
            </h3>
            <ul className="space-y-2.5">
              {platform.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2.5">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              {t("footer.contacts")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={`mailto:${s.email}`} className="hover:text-white transition-colors">
                  {s.email}
                </a>
              </li>
              <li>
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                  {s.phone}
                </a>
              </li>
              <li className="text-gray-500">{s.address}</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span>&copy; {new Date().getFullYear()} {s.site_name}. {t("footer.rights")}</span>
          <span className="text-gray-500">{t("footer.madeIn")}</span>
        </div>
      </div>
    </footer>
  );
}
