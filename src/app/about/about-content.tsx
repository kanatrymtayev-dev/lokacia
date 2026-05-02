"use client";

import { useT } from "@/lib/i18n";
import { WaveDivider } from "@/components/illustrations";

export default function AboutContent() {
  const { t } = useT();

  const values = Array.from({ length: 4 }, (_, i) => ({
    title: t(`about.val.${i + 1}.title`),
    desc: t(`about.val.${i + 1}.desc`),
  }));

  return (
    <>
      {/* Hero — dark */}
      <section className="bg-dark text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.12),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {t("about.title")}
          </h1>
          <p className="mt-4 text-lg text-dark-muted">
            {t("about.subtitle")}
          </p>
          <p className="font-handwritten text-xl text-accent/70 mt-2 -rotate-1">{t("about.hero.handwritten")}</p>
        </div>
      </section>

      <div className="bg-dark -mt-1">
        <WaveDivider fill="var(--background)" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 space-y-14">
        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("about.mission.title")}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t("about.mission.text")}
          </p>
        </section>

        {/* What we do */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("about.whatWeDo")}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-cream rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t("home.benefits.hosts")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("about.forHosts.desc")}
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t("about.forRenters")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("about.forRenters.desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("about.team")}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t("about.team.desc")}
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("about.values")}</h2>
          <div className="space-y-4">
            {values.map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">{v.title}</h3>
                  <p className="text-sm text-gray-600">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("about.contact.title")}</h2>
          <p className="text-gray-600 leading-relaxed">
            {t("about.contact.text")}{" "}
            <a href="mailto:hello@lokacia.kz" className="text-primary font-medium hover:underline">
              hello@lokacia.kz
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
