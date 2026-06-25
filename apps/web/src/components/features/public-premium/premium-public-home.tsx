"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Heart,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/design-system/motion";
import { useTranslation } from "@/providers/i18n-provider";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1920&q=80";

function FullBleed({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen ${className}`}>{children}</div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
  className = "",
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <h2 id={`${id}-title`} className="font-display text-3xl font-bold tracking-tight text-ecopet-dark dark:text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-lg text-ecopet-gray/90 dark:text-white/70">{subtitle}</p>
          )}
        </FadeIn>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function PremiumPublicHome() {
  const { t } = useTranslation();
  return (
    <div className="pb-8">
      {/* Hero fullscreen */}
      <FullBleed className="relative min-h-[88vh] overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt={t("pub.home.heroBadge")}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ecopet-dark/70 via-ecopet-dark/50 to-ecopet-dark/90" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-20 pt-32 sm:px-6 sm:pb-28">
          <FadeIn>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-md">
              <Heart className="h-4 w-4 text-ecopet-yellow" aria-hidden />
              {t("pub.home.heroBadge")}
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("pub.home.heroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
              {t("pub.home.heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-white px-8 text-ecopet-dark hover:bg-ecopet-cream">
                <Link href="/cadastro">{t("pub.home.createAccount")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/40 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link href="/login">{t("pub.home.signIn")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/40 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link href="/explorar">{t("pub.home.exploreNow")}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </FullBleed>

      <Section id="conheca" title={t("pub.home.areasTitle")} subtitle={t("pub.home.areasSubtitle")}>
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: t("pub.home.areaSocial"), href: "/social", icon: Users, desc: t("pub.home.areaSocialDesc") },
            { label: t("pub.home.areaExplore"), href: "/explorar", icon: Compass, desc: t("pub.home.areaExploreDesc") },
            { label: t("pub.home.areaMarketplace"), href: "/marketplace", icon: ShoppingBag, desc: t("pub.home.areaMarketplaceDesc") },
            { label: t("pub.home.areaEccopet"), href: "/eccopet", icon: Sparkles, desc: t("pub.home.areaEccopetDesc") },
            { label: t("pub.home.areaProfile"), href: "/perfil", icon: Heart, desc: t("pub.home.areaProfileDesc") },
          ].map((area) => (
            <StaggerItem key={area.href}>
              <Link
                href={area.href}
                className="card-premium group flex flex-col rounded-[20px] p-5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <area.icon className="h-7 w-7 text-ecopet-green transition group-hover:scale-110" aria-hidden />
                <p className="mt-4 font-semibold text-ecopet-dark dark:text-white">{area.label}</p>
                <p className="mt-1 text-sm text-ecopet-gray dark:text-white/60">{area.desc}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <FullBleed className="bg-ecopet-cream/60 dark:bg-ecopet-dark-card/40">
        <Section id="como-funciona" title={t("pub.home.howTitle")} subtitle={t("pub.home.howSubtitle")}>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: t("pub.home.how1Title"), text: t("pub.home.how1Text") },
              { step: "02", title: t("pub.home.how2Title"), text: t("pub.home.how2Text") },
              { step: "03", title: t("pub.home.how3Title"), text: t("pub.home.how3Text") },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-ecopet-gray/10 bg-white p-8 dark:bg-ecopet-dark-card">
                  <span className="font-display text-5xl font-bold text-ecopet-green/20">{item.step}</span>
                  <h3 className="mt-4 text-xl font-semibold text-ecopet-dark dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ecopet-gray dark:text-white/70">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Section>
      </FullBleed>

      <Section id="marketplace" title={t("pub.home.marketTitle")} subtitle={t("pub.home.marketSubtitle")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[t("pub.home.marketCat1"), t("pub.home.marketCat2"), t("pub.home.marketCat3"), t("pub.home.marketCat4")].map((cat) => (
            <Link
              key={cat}
              href="/marketplace/produtos"
              className="group card-premium flex items-center justify-between rounded-2xl p-5"
            >
              <span className="font-medium">{cat}</span>
              <ShoppingBag className="h-5 w-5 text-ecopet-green transition group-hover:scale-110" aria-hidden />
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild className="rounded-2xl">
            <Link href="/marketplace">
              {t("pub.home.marketCta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section id="servicos" title={t("pub.home.servicesTitle")} subtitle={t("pub.home.servicesSubtitle")}>
        <Button asChild size="lg" variant="outline" className="rounded-2xl">
          <Link href="/servicos">{t("pub.home.servicesCta")}</Link>
        </Button>
      </Section>

      <FullBleed className="gradient-ecopet">
        <Section id="comunidade" title={t("pub.home.communityTitle")} subtitle={t("pub.home.communitySubtitle")} className="text-white">
          <div className="flex flex-wrap items-center gap-4">
            <MessageCircle className="h-10 w-10 text-ecopet-yellow" aria-hidden />
            <p className="max-w-xl text-lg text-white/90">
              {t("pub.home.communityText")}
            </p>
          </div>
          <Button asChild size="lg" className="mt-8 rounded-2xl bg-white text-ecopet-dark hover:bg-ecopet-cream">
            <Link href="/social">{t("pub.home.communityCta")}</Link>
          </Button>
        </Section>
      </FullBleed>

      <Section id="ongs" title={t("pub.home.ngosTitle")} subtitle={t("pub.home.ngosSubtitle")}>
        <Button asChild className="rounded-2xl">
          <Link href="/adocao">{t("pub.home.ngosCta")}</Link>
        </Button>
      </Section>

      <FullBleed className="border-y border-ecopet-gray/10 bg-white dark:bg-ecopet-dark-card/30">
        <Section id="ia" title={t("pub.home.aiTitle")} subtitle={t("pub.home.aiSubtitle")}>
          <div className="card-premium flex flex-col gap-6 rounded-2xl p-8 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ecopet-green/10">
              <Sparkles className="h-8 w-8 text-ecopet-green" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-ecopet-gray dark:text-white/70">
                {t("pub.home.aiText")}
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 rounded-2xl">
              <Link href="/eccopet">{t("pub.home.aiCta")}</Link>
            </Button>
          </div>
        </Section>
      </FullBleed>

      <Section id="depoimentos" title={t("pub.home.testimonialsTitle")} subtitle={t("pub.home.testimonialsSubtitle")}>
        <StaggerChildren className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Marina", text: t("pub.home.t1Text"), pet: t("pub.home.t1Pet") },
            { name: "Ricardo", text: t("pub.home.t2Text"), pet: t("pub.home.t2Pet") },
            { name: "Ana", text: t("pub.home.t3Text"), pet: t("pub.home.t3Pet") },
          ].map((item) => (
            <StaggerItem key={item.name}>
              <blockquote className="card-premium rounded-2xl p-6">
                <div className="flex gap-1 text-ecopet-yellow" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ecopet-gray dark:text-white/80">&ldquo;{item.text}&rdquo;</p>
                <footer className="mt-4 text-sm font-medium text-ecopet-dark dark:text-white">
                  {item.name} · <span className="font-normal text-ecopet-gray">{item.pet}</span>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <FullBleed className="bg-ecopet-dark">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <FadeIn>
            <Users className="mx-auto h-12 w-12 text-ecopet-yellow" aria-hidden />
            <h2 className="mt-6 font-display text-3xl font-bold text-white sm:text-4xl">
              {t("pub.home.finalTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              {t("pub.home.finalSubtitle")}
            </p>
            <Button asChild size="lg" className="mt-10 rounded-2xl bg-ecopet-yellow px-10 text-ecopet-dark hover:bg-ecopet-yellow/90">
              <Link href="/cadastro">{t("pub.home.finalCta")}</Link>
            </Button>
          </FadeIn>
        </section>
      </FullBleed>
    </div>
  );
}
