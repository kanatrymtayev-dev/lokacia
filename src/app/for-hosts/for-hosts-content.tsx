"use client";

import Link from "next/link";
import AnimatedSection from "@/components/animated-section";
import { WaveDivider } from "@/components/illustrations";
import { useT } from "@/lib/i18n";

const stepNums = ["01", "02", "03", "04"] as const;

export default function ForHostsContent() {
  const { t } = useT();

  const steps = [
    { num: stepNums[0], title: t("forHosts.step.1.title"), desc: t("forHosts.step.1.desc"), note: t("forHosts.step.1.note") },
    { num: stepNums[1], title: t("forHosts.step.2.title"), desc: t("forHosts.step.2.desc"), note: t("forHosts.step.2.note") },
    { num: stepNums[2], title: t("forHosts.step.3.title"), desc: t("forHosts.step.3.desc"), note: t("forHosts.step.3.note") },
    { num: stepNums[3], title: t("forHosts.step.4.title"), desc: t("forHosts.step.4.desc"), note: t("forHosts.step.4.note") },
  ];

  const benefits = [
    { title: t("forHosts.benefit.1.title"), desc: t("forHosts.benefit.1.desc") },
    { title: t("forHosts.benefit.2.title"), desc: t("forHosts.benefit.2.desc") },
    { title: t("forHosts.benefit.3.title"), desc: t("forHosts.benefit.3.desc") },
    { title: t("forHosts.benefit.4.title"), desc: t("forHosts.benefit.4.desc") },
    { title: t("forHosts.benefit.5.title"), desc: t("forHosts.benefit.5.desc") },
    { title: t("forHosts.benefit.6.title"), desc: t("forHosts.benefit.6.desc") },
  ];

  return (
    <main className="flex-1">
      {/* Hero — dark */}
      <section className="bg-dark text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {t("forHosts.hero.title1")}
              <br />
              <span className="bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">{t("forHosts.hero.title2")}</span>
            </h1>
            <p className="font-handwritten text-xl text-accent/70 mt-2 -rotate-1">{t("forHosts.hero.easier")}</p>
            <p className="mt-6 text-lg sm:text-xl text-dark-text/80 leading-relaxed max-w-2xl">
              {t("forHosts.hero.desc")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register?role=host"
                className="inline-flex items-center justify-center bg-accent text-gray-900 px-8 py-4 rounded-full text-base font-bold hover:bg-amber-300 transition-all active:scale-[0.97] shadow-lg"
              >
                {t("forHosts.hero.cta")}
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/#how"
                className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                {t("forHosts.hero.howItWorks")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-dark -mt-1">
        <WaveDivider fill="var(--background)" />
      </div>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t("forHosts.steps.title")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <AnimatedSection key={step.num} delay={`${i * 120}ms`}>
                <div className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-x-4" />
                  )}
                  <div className="text-6xl font-black text-primary/10">{step.num}</div>
                  <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{step.desc}</p>
                  <p className="font-handwritten text-lg text-primary mt-2 -rotate-1">{step.note}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t("forHosts.benefits.title")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <AnimatedSection key={i} delay={`${i * 100}ms`}>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — dark */}
      <section className="py-20 sm:py-28 bg-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.1),transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm font-semibold mb-4 border border-accent/20">
            {t("forHosts.cta.badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t("forHosts.cta.title")}
          </h2>
          <p className="mt-4 text-lg text-dark-muted">
            {t("forHosts.cta.free")}
          </p>
          <p className="font-handwritten text-xl text-rose mt-2 -rotate-1">{t("forHosts.cta.freeBadge")}</p>
          <div className="mt-8">
            <Link
              href="/register?role=host"
              className="inline-flex items-center justify-center bg-primary text-white px-8 py-4 rounded-full text-base font-bold hover:bg-primary-light transition-all active:scale-[0.97] shadow-lg shadow-primary/25"
            >
              {t("forHosts.cta.cta")}
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
