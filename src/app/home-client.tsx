"use client";

import Image from "next/image";
import Link from "next/link";
import ListingCard from "@/components/listing-card";
import HeroSearch from "@/components/hero-search";
import FaqAccordion from "@/components/faq-accordion";
import HostForm from "./host-form";
import { SectionTitle } from "./home-sections";
import AnimatedSection from "@/components/animated-section";
import CountUp from "@/components/count-up";
import StickySteps from "@/components/sticky-steps";
import {
  HeroDecor, WaveDivider,
  IllustrationCamera, IllustrationParty, IllustrationHouse, IllustrationFilm,
  IllustrationYurt, IllustrationCutlery, IllustrationDesk, IllustrationMountain,
} from "@/components/illustrations";
import { useT } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

const categoryIllustrations = [
  <IllustrationCamera key="cam" className="w-10 h-10" />,
  <IllustrationParty key="party" className="w-10 h-10" />,
  <IllustrationHouse key="house" className="w-10 h-10" />,
  <IllustrationFilm key="film" className="w-10 h-10" />,
  <IllustrationYurt key="yurt" className="w-10 h-10" />,
  <IllustrationCutlery key="cutlery" className="w-10 h-10" />,
  <IllustrationDesk key="desk" className="w-10 h-10" />,
  <IllustrationMountain key="mountain" className="w-10 h-10" />,
];

const catKeys = ["photo", "event", "home", "stage", "ethno", "restaurant", "office", "chalet"] as const;
const catImages = [
  "/images/categories/photo-studio.webp",
  "/images/categories/event-space.webp",
  "/images/categories/apartment.webp",
  "/images/categories/sound-stage.webp",
  "/images/categories/ethno-space.webp",
  "/images/categories/restaurant.webp",
  "/images/categories/meeting-room.webp",
  "/images/categories/mountain-chalet.webp",
];

const statValues = ["500+", "115K", "514", "93%"];
const statKeys = ["productions", "weddings", "films", "online"];

export default function HomeClient({ listings }: { listings: Listing[] }) {
  const { t } = useT();

  const benefitHostKeys = ["1", "2", "3", "4", "5", "6"];
  const benefitRenterKeys = ["1", "2", "3", "4", "5", "6"];

  const faqItems = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`home.faq.${i}.q`),
    a: t(`home.faq.${i}.a`),
  }));

  const testimonials = [1, 2, 3].map((i) => ({
    name: t(`home.test.${i}.name`),
    role: t(`home.test.${i}.role`),
    text: t(`home.test.${i}.text`),
    rating: 5,
  }));

  return (
    <>
      {/* Hero — Dark cinematic */}
      <section className="relative overflow-hidden text-white bg-dark min-h-[90vh] flex items-center">
        <Image
          src="/images/hero.webp"
          alt="LOKACIA"
          fill
          className="object-cover opacity-30"
          priority
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/40 to-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.08),transparent_50%)]" />
        <HeroDecor />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {t("home.hero.badge")}
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              {t("home.hero.title1")}
              <br />
              <span className="bg-gradient-to-r from-accent via-amber-300 to-accent bg-clip-text text-transparent">{t("home.hero.title2")}</span>
            </h1>
            <p className="font-handwritten text-2xl text-accent/80 mt-3 -rotate-2">
              {t("home.hero.annotation")}
            </p>
            <p className="mt-6 text-lg sm:text-xl text-dark-text/80 max-w-2xl mx-auto leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-white/90 border border-white/5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              {t("home.hero.free")}
            </div>
            <div className="mt-10">
              <HeroSearch />
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {statValues.map((val, i) => (
              <div key={statKeys[i]} className="bg-dark-surface/80 backdrop-blur-sm rounded-2xl p-5 border border-dark-border hover:border-primary/30 transition-colors">
                <CountUp end={val} className="text-3xl sm:text-4xl font-bold text-accent" />
                <div className="mt-1 text-sm text-dark-muted">{t(`home.stats.${statKeys[i]}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-dark -mt-1">
        <WaveDivider fill="var(--cream)" />
      </div>

      {/* Categories */}
      <section id="categories" className="py-20 sm:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle titleKey="home.categories.title" subtitleKey="home.categories.subtitle" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {catKeys.map((key, i) => (
              <AnimatedSection key={key} animation="fade-in-scale" delay={`${i * 80}ms`}>
                <div className="group relative rounded-2xl overflow-hidden h-56 sm:h-64 cursor-pointer">
                  <Image src={catImages[i]} alt={t(`home.cat.${key}.title`)} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width: 640px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-primary/80 group-hover:via-primary/30 transition-all duration-300" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {categoryIllustrations[i]}
                    </div>
                    <h3 className="font-bold text-lg text-white">{t(`home.cat.${key}.title`)}</h3>
                    <p className="mt-1 text-sm text-white/80">{t(`home.cat.${key}.desc`)}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      {listings.length > 0 && (
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("home.popular.title")}</h2>
                <p className="mt-3 text-lg text-gray-600">{t("home.popular.subtitle")}</p>
              </div>
              <Link href="/catalog" className="hidden sm:inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                {t("common.viewAll")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.slice(0, 6).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/catalog" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                {t("common.viewAllLocations")}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <SectionTitle titleKey="home.howItWorks.title" subtitleKey="home.howItWorks.subtitle" />
            <p className="font-handwritten text-xl text-accent -rotate-1 -mt-8">{t("steps.easier")}</p>
          </div>
          <StickySteps />
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 sm:py-28 bg-warm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle titleKey="home.benefits.title" />
          <div className="grid md:grid-cols-2 gap-8">
            {[{ titleKey: "home.benefits.hosts", keys: benefitHostKeys, prefix: "home.benefits.host" },
              { titleKey: "home.benefits.renters", keys: benefitRenterKeys, prefix: "home.benefits.renter" }].map((b, i) => (
              <AnimatedSection key={b.titleKey} delay={`${i * 150}ms`}>
                <div className="bg-white rounded-2xl p-8 border border-gray-200">
                  <h3 className="text-2xl font-bold mb-6">{t(b.titleKey)}</h3>
                  <ul className="space-y-4">
                    {b.keys.map((k) => (
                      <li key={k} className="flex gap-3">
                        <svg className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="text-gray-700">{t(`${b.prefix}.${k}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle titleKey="home.testimonials.title" subtitleKey="home.testimonials.subtitle" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((tm, i) => (
              <AnimatedSection key={tm.name} delay={`${i * 150}ms`}>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: tm.rating }).map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 0 0-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-5">&ldquo;{tm.text}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{tm.name}</div>
                    <div className="text-xs text-gray-500">{tm.role}</div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle titleKey="home.faq.title" subtitleKey="home.faq.subtitle" />
          <FaqAccordion items={faqItems} />
          <div className="mt-8 text-center">
            <Link href="/faq" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
              {t("home.faq.viewAll")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA / Form */}
      <section id="form" className="py-20 sm:py-28 bg-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm font-semibold mb-4 border border-accent/20">
                {t("home.cta.badge")}
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                {t("home.cta.title").split("—")[0]}—
                <br />
                <span className="text-accent">{t("home.cta.title").split("—")[1] || ""}</span>
              </h2>
              <p className="mt-4 text-lg text-dark-muted">
                {t("home.cta.subtitle", { highlight: "" }).replace("{highlight}", "")}
              </p>
              <p className="font-handwritten text-xl text-rose mt-2 -rotate-1">{t("home.cta.freeBadge")}</p>
            </div>
            <div className="bg-dark-surface rounded-2xl border border-dark-border p-6 sm:p-8">
              <HostForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
