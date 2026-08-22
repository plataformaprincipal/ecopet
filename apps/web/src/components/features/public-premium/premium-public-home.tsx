"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Lock,
  Network,
  Scissors,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand/brand-mark";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/design-system/motion";
import { useTranslation } from "@/providers/i18n-provider";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1920&q=80";

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
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("py-16 sm:py-24", className)}>
      <div className="ep-container max-w-6xl">
        <FadeIn>
          <h2
            id={`${id}-title`}
            className="font-display text-3xl font-bold tracking-tight text-[var(--ep-fg)] sm:text-4xl"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--ep-fg-muted)] sm:text-lg">
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
  const { isAuthenticated, loading } = useFoundationSession();

  const doors = [
    {
      label: t("pub.home.areaEccopet"),
      href: "/eccopet",
      icon: Sparkles,
      desc: t("pub.home.areaAiBenefit"),
      featured: true,
    },
    {
      label: t("pub.home.areaMarketplace"),
      href: "/marketplace",
      icon: ShoppingBag,
      desc: t("pub.home.areaMarketBenefit"),
    },
    {
      label: t("pub.home.servicesTitle"),
      href: "/servicos",
      icon: Scissors,
      desc: t("pub.home.areaServicesBenefit"),
    },
    {
      label: t("pub.home.communityTitle"),
      href: "/social",
      icon: Users,
      desc: t("pub.home.areaCommunityBenefit"),
    },
    {
      label: t("pub.home.areaAdoption"),
      href: "/adocao",
      icon: Heart,
      desc: t("pub.home.areaAdoptionDesc"),
    },
  ];

  const trustItems = [
    { icon: Network, title: t("pub.home.trustPartners"), text: t("pub.home.trustPartnersText") },
    { icon: Lock, title: t("pub.home.trustSecurity"), text: t("pub.home.trustSecurityText") },
    { icon: Sparkles, title: t("pub.home.trustIntegrated"), text: t("pub.home.trustIntegratedText") },
    { icon: Heart, title: t("pub.home.trustNgos"), text: t("pub.home.trustNgosText") },
  ];

  return (
    <div className="overflow-x-hidden pb-4">
      <FullBleed className="relative min-h-[min(78vh,820px)] overflow-hidden bg-[#0f1713]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1713] via-[#0f1713]/80 to-ecopet-green-800/55" />

        <div className="relative mx-auto flex min-h-[min(78vh,820px)] max-w-6xl flex-col justify-center px-4 pb-16 pt-24 sm:px-6 lg:pb-24">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-3">
              <BrandMark size={44} tone="on-dark" />
              <span className="font-display text-2xl font-bold tracking-tight text-white">EccoPet</span>
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white">
              {t("pub.home.heroTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-xl">
              {t("pub.home.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="min-h-[48px] rounded-xl bg-ecopet-green px-8 text-white hover:bg-ecopet-green-700">
                <Link href="#ecossistema">
                  {t("pub.home.exploreEcosystem")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-[48px] rounded-xl border-white/30 bg-white/5 px-8 text-white hover:bg-white/10"
              >
                <Link href="/marketplace">{t("pub.home.marketCta")}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </FullBleed>

      <Section id="ecossistema" title={t("pub.home.areasTitle")} subtitle={t("pub.home.areasSubtitle")}>
        <StaggerChildren className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {doors.map((area) => (
            <StaggerItem key={area.href} className={area.featured ? "md:col-span-2 lg:col-span-2" : "lg:col-span-1"}>
              <Link
                href={area.href}
                className={cn(
                  "group flex h-full flex-col rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-5 shadow-[var(--shadow-xs)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]",
                  area.featured && "lg:p-6"
                )}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ecopet-green/10 text-ecopet-green">
                  <area.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <p className="mt-4 font-display text-base font-semibold text-[var(--ep-fg)]">{area.label}</p>
                <p className="mt-1 flex-1 text-sm text-[var(--ep-fg-muted)]">{area.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ecopet-green">
                  {t("pub.card.viewDetails")}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <FullBleed className="bg-[var(--surface-muted)]">
        <Section id="ia" title={t("pub.home.aiTitle")} subtitle={t("pub.home.aiSubtitle")}>
          <div className="flex flex-col gap-6 overflow-hidden rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ecopet-green/10 text-ecopet-green">
              <Sparkles className="h-8 w-8" strokeWidth={2} aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-ecopet-green">
                {t("pub.home.aiFreeBadge")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ep-fg-muted)] sm:text-base">
                {t("pub.home.aiText")}
              </p>
            </div>
            <Button asChild className="shrink-0 rounded-xl">
              <Link href="/eccopet">{t("pub.home.aiCta")}</Link>
            </Button>
          </div>
        </Section>
      </FullBleed>

      <Section id="marketplace" title={t("pub.home.marketServicesTitle")} subtitle={t("pub.home.marketServicesSubtitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/marketplace"
            className="rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-sm)]"
          >
            <ShoppingBag className="h-6 w-6 text-ecopet-green" aria-hidden />
            <h3 className="mt-4 font-display text-xl font-semibold">{t("pub.home.areaMarketplace")}</h3>
            <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">{t("pub.home.areaMarketBenefit")}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ecopet-green">
              {t("cart.exploreProducts")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
          <Link
            href="/servicos"
            className="rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-sm)]"
          >
            <Scissors className="h-6 w-6 text-ecopet-green" aria-hidden />
            <h3 className="mt-4 font-display text-xl font-semibold">{t("pub.home.servicesTitle")}</h3>
            <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">{t("pub.home.areaServicesBenefit")}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ecopet-green">
              {t("cart.findServices")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>
      </Section>

      <FullBleed className="bg-[var(--surface-muted)]">
        <Section id="comunidade" title={t("pub.home.communityAdoptionTitle")} subtitle={t("pub.home.communityAdoptionSubtitle")}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/social", label: t("pub.home.communityTitle") },
              { href: "/adocao", label: t("pub.home.areaAdoption") },
              { href: "/ngos", label: t("pub.home.ngosTitle") },
            ].map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] px-5 py-4 font-medium text-[var(--ep-fg)] transition hover:border-ecopet-green/30"
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </Section>
      </FullBleed>

      <Section id="confianca" title={t("pub.home.trustTitle")} subtitle={t("pub.home.trustSubtitle")}>
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <StaggerItem key={item.title}>
              <article className="h-full rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] p-5 shadow-[var(--shadow-xs)]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ecopet-green/10 text-ecopet-green">
                  <item.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--ep-fg)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ep-fg-muted)]">{item.text}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <FullBleed className="bg-[#0f1713]">
        <section className="ep-container max-w-6xl py-20 text-center">
          <FadeIn>
            <BrandMark size={56} tone="on-dark" className="mx-auto" />
            <h2 className="mt-6 font-display text-3xl font-bold text-white sm:text-4xl">
              {!loading && isAuthenticated ? t("pub.home.finalAuthTitle") : t("pub.home.finalTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              {!loading && isAuthenticated ? t("pub.home.heroSubtitle") : t("pub.home.finalSubtitle")}
            </p>
            <Button asChild size="lg" className="mt-10 rounded-xl bg-ecopet-green px-10 text-white hover:bg-ecopet-green-700">
              <Link href={!loading && isAuthenticated ? "/marketplace" : "/cadastro"}>
                {!loading && isAuthenticated ? t("pub.home.finalAuthCta") : t("pub.home.finalCta")}
              </Link>
            </Button>
          </FadeIn>
        </section>
      </FullBleed>
    </div>
  );
}
