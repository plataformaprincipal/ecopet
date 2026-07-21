"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Heart,
  Lock,
  MessageCircle,
  Network,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand/brand-mark";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/design-system/motion";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1920&q=80";

const MODULE_IMAGES = {
  social: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
  explore: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80",
  market: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80",
  ai: "https://images.unsplash.com/photo-1558787533-047ed6946526?auto=format&fit=crop&w=800&q=80",
  profile: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
} as const;

function FullBleed({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative left-1/2 right-1/2 -mx-[50vw] w-screen", className)}>{children}</div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
  className,
  light,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("py-16 sm:py-24", className)}>
      <div className="ep-container max-w-6xl">
        <FadeIn>
          <h2
            id={`${id}-title`}
            className={cn(
              "font-display text-3xl font-bold tracking-tight sm:text-4xl",
              light ? "text-white" : "text-ecopet-dark dark:text-white"
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={cn(
                "mt-3 max-w-2xl text-base leading-relaxed sm:text-lg",
                light ? "text-white/75" : "text-ecopet-gray dark:text-white/70"
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </FadeIn>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function PremiumPublicHome() {
  const { t } = useTranslation();

  const modules = [
    {
      label: t("pub.home.areaSocial"),
      href: "/social",
      icon: Users,
      desc: t("pub.home.areaSocialDesc"),
      image: MODULE_IMAGES.social,
      cta: t("pub.home.communityCta"),
    },
    {
      label: t("pub.home.areaMarketplace"),
      href: "/marketplace",
      icon: ShoppingBag,
      desc: t("pub.home.areaMarketplaceDesc"),
      image: MODULE_IMAGES.market,
      cta: t("pub.home.marketCta"),
    },
    {
      label: t("pub.home.areaExplore"),
      href: "/explorar",
      icon: Compass,
      desc: t("pub.home.areaExploreDesc"),
      image: MODULE_IMAGES.explore,
      cta: t("pub.home.exploreNow"),
    },
    {
      label: t("pub.home.areaEccopet"),
      href: "/eccopet",
      icon: Sparkles,
      desc: t("pub.home.areaEccopetDesc"),
      image: MODULE_IMAGES.ai,
      cta: t("pub.home.aiCta"),
    },
    {
      label: t("pub.home.areaProfile"),
      href: "/perfil",
      icon: Heart,
      desc: t("pub.home.areaProfileDesc"),
      image: MODULE_IMAGES.profile,
      cta: t("pub.home.signIn"),
    },
  ];

  const whyItems = [
    { icon: Network, title: t("pub.home.areasTitle"), text: t("pub.home.areasSubtitle") },
    { icon: Sparkles, title: t("pub.home.aiTitle"), text: t("pub.home.aiText") },
    { icon: ShoppingBag, title: t("pub.home.marketTitle"), text: t("pub.home.marketSubtitle") },
    { icon: Users, title: t("pub.home.communityTitle"), text: t("pub.home.communityText") },
    { icon: Heart, title: t("pub.home.ngosTitle"), text: t("pub.home.ngosSubtitle") },
    { icon: Lock, title: t("pub.home.how3Title"), text: t("pub.home.how3Text") },
  ];

  const stats = [
    { value: "1.2k+", label: t("pub.explore.catPetShops") },
    { value: "340+", label: t("pub.home.ngosTitle") },
    { value: "8k+", label: t("pub.explore.catProducts") },
    { value: "5k+", label: t("pub.explore.catAdoption") },
    { value: "2.1k+", label: t("pub.explore.catServices") },
    { value: "12k+", label: t("pub.home.communityTitle") },
  ];

  return (
    <div className="overflow-x-hidden pb-4">
      {/* Hero */}
      <FullBleed className="relative min-h-[min(92vh,920px)] overflow-hidden bg-ecopet-dark">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover opacity-55"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ecopet-dark via-ecopet-dark/85 to-ecopet-green-800/70" />
        <div
          className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-ecopet-green-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[min(92vh,920px)] max-w-6xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:pb-24">
          <FadeIn>
            <div className="mb-8 inline-flex items-center gap-3">
              <BrandMark size={48} tone="on-dark" />
              <span className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                EcoPet
              </span>
            </div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-md">
              <Zap className="h-4 w-4 text-ecopet-green-500" strokeWidth={2} aria-hidden />
              {t("pub.home.heroBadge")}
            </p>
            <h1 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-white">
              {t("pub.home.heroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-xl">
              {t("pub.home.heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="min-h-[48px] rounded-xl bg-ecopet-green px-8 text-white hover:bg-ecopet-green-700">
                <Link href="/cadastro">{t("pub.home.createAccount")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-[48px] rounded-xl border-white/35 bg-white/5 px-8 text-white backdrop-blur-sm hover:bg-white/15"
              >
                <Link href="/login">{t("pub.home.signIn")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="min-h-[48px] rounded-xl px-6 text-white hover:bg-white/10"
              >
                <Link href="/explorar">
                  {t("pub.home.exploreNow")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </FullBleed>

      {/* Modules as apps */}
      <Section id="conheca" title={t("pub.home.areasTitle")} subtitle={t("pub.home.areasSubtitle")}>
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {modules.map((area) => (
            <StaggerItem key={area.href}>
              <Link
                href={area.href}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-ecopet-gray/10 bg-white shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green dark:border-white/10 dark:bg-ecopet-dark-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={area.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ecopet-dark/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md">
                    <area.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-display text-base font-semibold text-ecopet-dark dark:text-white">
                    {area.label}
                  </p>
                  <p className="mt-1 flex-1 text-sm text-ecopet-gray dark:text-white/65">{area.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ecopet-green">
                    {area.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      {/* Why EcoPet */}
      <FullBleed className="bg-ecopet-cream/80 dark:bg-ecopet-dark-card/40">
        <Section id="por-que" title={t("pub.home.howTitle")} subtitle={t("pub.home.howSubtitle")}>
          <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item) => (
              <StaggerItem key={item.title}>
                <article className="h-full rounded-[var(--radius-xl)] border border-ecopet-gray/10 bg-white p-6 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-bg">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ecopet-green/10 text-ecopet-green">
                    <item.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ecopet-dark dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ecopet-gray dark:text-white/70">{item.text}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </Section>
      </FullBleed>

      {/* Stats */}
      <Section id="indicadores" title={t("pub.home.areasTitle")} subtitle={t("pub.home.finalSubtitle")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius-lg)] border border-ecopet-green/15 bg-gradient-to-b from-ecopet-green/[0.06] to-transparent px-3 py-5 text-center dark:from-ecopet-green/15"
            >
              <p className="font-display text-2xl font-bold tracking-tight text-ecopet-green sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-ecopet-gray dark:text-white/65">{stat.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Marketplace strip */}
      <Section id="marketplace" title={t("pub.home.marketTitle")} subtitle={t("pub.home.marketSubtitle")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[t("pub.home.marketCat1"), t("pub.home.marketCat2"), t("pub.home.marketCat3"), t("pub.home.marketCat4")].map(
            (cat) => (
              <Link
                key={cat}
                href="/marketplace/produtos"
                className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-ecopet-gray/10 bg-white px-5 py-4 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-ecopet-green/30 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
              >
                <span className="font-medium text-ecopet-dark dark:text-white">{cat}</span>
                <ShoppingBag
                  className="h-5 w-5 text-ecopet-green transition group-hover:scale-110"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            )
          )}
        </div>
        <div className="mt-8">
          <Button asChild className="rounded-xl">
            <Link href="/marketplace">
              {t("pub.home.marketCta")} <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      {/* Community band */}
      <FullBleed className="gradient-ecopet">
        <Section
          id="comunidade"
          title={t("pub.home.communityTitle")}
          subtitle={t("pub.home.communitySubtitle")}
          light
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                <MessageCircle className="h-6 w-6" strokeWidth={2} aria-hidden />
              </span>
              <p className="max-w-xl text-base text-white/90 sm:text-lg">{t("pub.home.communityText")}</p>
            </div>
            <Button asChild size="lg" className="shrink-0 rounded-xl bg-white text-ecopet-dark hover:bg-white/90">
              <Link href="/social">{t("pub.home.communityCta")}</Link>
            </Button>
          </div>
        </Section>
      </FullBleed>

      {/* AI */}
      <Section id="ia" title={t("pub.home.aiTitle")} subtitle={t("pub.home.aiSubtitle")}>
        <div className="flex flex-col gap-6 overflow-hidden rounded-[var(--radius-xl)] border border-ecopet-green/20 bg-gradient-to-br from-ecopet-green/[0.07] via-white to-white p-6 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:p-8 dark:from-ecopet-green/20 dark:via-ecopet-dark-card dark:to-ecopet-dark-card">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ecopet-dark text-white shadow-[var(--shadow-sm)]">
            <Sparkles className="h-8 w-8" strokeWidth={2} aria-hidden />
          </div>
          <p className="flex-1 text-sm leading-relaxed text-ecopet-gray dark:text-white/75 sm:text-base">
            {t("pub.home.aiText")}
          </p>
          <Button asChild className="shrink-0 rounded-xl">
            <Link href="/eccopet">{t("pub.home.aiCta")}</Link>
          </Button>
        </div>
      </Section>

      {/* Testimonials */}
      <Section id="depoimentos" title={t("pub.home.testimonialsTitle")} subtitle={t("pub.home.testimonialsSubtitle")}>
        <StaggerChildren className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Marina", text: t("pub.home.t1Text"), pet: t("pub.home.t1Pet") },
            { name: "Ricardo", text: t("pub.home.t2Text"), pet: t("pub.home.t2Pet") },
            { name: "Ana", text: t("pub.home.t3Text"), pet: t("pub.home.t3Pet") },
          ].map((item) => (
            <StaggerItem key={item.name}>
              <blockquote className="h-full rounded-[var(--radius-xl)] border border-ecopet-gray/10 bg-white p-6 shadow-[var(--shadow-sm)] dark:border-white/10 dark:bg-ecopet-dark-card">
                <div className="flex gap-1 text-ecopet-green" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ecopet-gray dark:text-white/80">
                  &ldquo;{item.text}&rdquo;
                </p>
                <footer className="mt-4 text-sm font-semibold text-ecopet-dark dark:text-white">
                  {item.name} · <span className="font-normal text-ecopet-gray">{item.pet}</span>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      {/* Final CTA */}
      <FullBleed className="bg-ecopet-dark">
        <section className="ep-container max-w-6xl py-20 text-center">
          <FadeIn>
            <BrandMark size={56} tone="on-dark" className="mx-auto" />
            <h2 className="mt-6 font-display text-3xl font-bold text-white sm:text-4xl">
              {t("pub.home.finalTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">{t("pub.home.finalSubtitle")}</p>
            <Button asChild size="lg" className="mt-10 rounded-xl bg-ecopet-green px-10 text-white hover:bg-ecopet-green-700">
              <Link href="/cadastro">{t("pub.home.finalCta")}</Link>
            </Button>
          </FadeIn>
        </section>
      </FullBleed>
    </div>
  );
}
