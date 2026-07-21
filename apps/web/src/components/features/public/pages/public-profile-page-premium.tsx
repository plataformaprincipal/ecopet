"use client";

import Link from "next/link";
import { Building2, Heart, LogIn, PawPrint, Store, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";

export function PublicProfilePagePremium() {
  const { t } = useTranslation();
  const ACCOUNT_TYPES = [
    {
      icon: PawPrint,
      title: t("pub.profile.tutorTitle"),
      typeLabel: t("pub.profile.tutor"),
      href: "/cadastro?tipo=cliente",
      benefits: [t("pub.profile.tutorB1"), t("pub.profile.tutorB2"), t("pub.profile.tutorB3"), t("pub.profile.tutorB4")],
    },
    {
      icon: Store,
      title: t("pub.profile.partnerTitle"),
      typeLabel: t("pub.profile.partner"),
      href: "/cadastro?tipo=parceiro",
      benefits: [t("pub.profile.partnerB1"), t("pub.profile.partnerB2"), t("pub.profile.partnerB3"), t("pub.profile.partnerB4")],
    },
    {
      icon: Building2,
      title: t("pub.profile.ngoTitle"),
      typeLabel: t("pub.profile.ngo"),
      href: "/cadastro?tipo=ong",
      benefits: [t("pub.profile.ngoB1"), t("pub.profile.ngoB2"), t("pub.profile.ngoB3"), t("pub.profile.ngoB4")],
    },
  ];
  return (
    <div className="space-y-10 animate-fade-in">
      <header className="rounded-[var(--radius-xl)] bg-gradient-to-br from-ecopet-dark via-ecopet-green-900 to-ecopet-green-800 p-8 text-white shadow-[var(--shadow-md)] sm:p-12">
        <Heart className="h-10 w-10 text-ecopet-green-500" strokeWidth={2} aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("pub.profile.heroTitle")}</h1>
        <p className="mt-3 max-w-xl text-white/80">
          {t("pub.profile.heroSubtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-[var(--radius-button)] bg-white text-ecopet-dark hover:bg-ecopet-cream">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" strokeWidth={2} aria-hidden />
              {t("pub.profile.signIn")}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-[var(--radius-button)] border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/cadastro">
              <UserPlus className="mr-2 h-4 w-4" strokeWidth={2} aria-hidden />
              {t("pub.profile.createAccount")}
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {ACCOUNT_TYPES.map(({ icon: Icon, title, typeLabel, href, benefits }) => (
          <article
            key={title}
            className="flex flex-col rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-ecopet-green/10">
              <Icon className="h-6 w-6 text-ecopet-green" strokeWidth={2} aria-hidden />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-ecopet-dark dark:text-white">
              {t("pub.profile.createAccountFor", { type: typeLabel })}
            </h2>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ecopet-gray dark:text-white/70">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ecopet-green" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 rounded-[var(--radius-button)]">
              <Link href={href}>{t("pub.profile.createAccountFor", { type: typeLabel })}</Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
