"use client";

import { useT } from "@/lib/i18n";
import FaqAccordion from "./faq-accordion";

export default function FaqContent() {
  const { t } = useT();

  const faqs = Array.from({ length: 10 }, (_, i) => ({
    q: t(`faq.${i + 1}.q`),
    a: t(`faq.${i + 1}.a`),
  }));

  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-white py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
            {t("faq.title")}
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            {t("faq.subtitle")}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <FaqAccordion items={faqs} />

        <div className="mt-12 text-center bg-warm/50 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t("faq.noAnswer")}</h2>
          <p className="text-gray-600 mb-4">{t("faq.contactUs")}</p>
          <a
            href="mailto:hello@lokacia.kz"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            hello@lokacia.kz
          </a>
        </div>
      </div>
    </>
  );
}
