"use client";

import { useT } from "@/lib/i18n";

export function HeroText() {
  const { t } = useT();
  return (
    <>
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        {t("hero.badge")}
      </div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
        {t("hero.title1")}
        <br />
        <span className="text-amber-400">{t("hero.title2")}</span>
      </h1>
      <p className="mt-6 text-lg sm:text-xl text-violet-200 max-w-2xl mx-auto leading-relaxed">
        {t("hero.subtitle")}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-white/90">
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
        0% комиссии — бесплатно для хостов и арендаторов
      </div>
    </>
  );
}

export function SectionTitle({ titleKey, subtitleKey }: { titleKey: string; subtitleKey?: string }) {
  const { t } = useT();
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
        {t(titleKey)}
      </h2>
      {subtitleKey && (
        <p className="mt-4 text-lg text-gray-600">
          {t(subtitleKey)}
        </p>
      )}
    </div>
  );
}

export function T({ k, className }: { k: string; className?: string }) {
  const { t } = useT();
  return <span className={className}>{t(k)}</span>;
}
