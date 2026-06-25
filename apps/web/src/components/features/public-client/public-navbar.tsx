"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Accessibility } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { PREMIUM_PUBLIC_NAV, isPremiumNavActive } from "@/lib/public-client/premium-nav";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-ecopet-gray/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-ecopet-dark-bg/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <EcoPetLogo href="/" size="sm" showText />

        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label={t("nav.home")}
        >
          {PREMIUM_PUBLIC_NAV.map((item) => {
            const active = isPremiumNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-ecopet-green text-white"
                    : "text-ecopet-gray hover:bg-ecopet-cream hover:text-ecopet-dark dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSelector compact className="shrink-0" />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden rounded-xl sm:inline-flex"
            aria-label={t("pub.nav.accessibility")}
          >
            <a href="#ecopet-a11y-toolbar" title={t("pub.nav.accessibility")}>
              <Accessibility className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden rounded-xl sm:inline-flex">
            <Link href="/login">{t("common.signIn")}</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/cadastro">{t("common.createAccount")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
