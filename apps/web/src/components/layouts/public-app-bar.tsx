"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSelector } from "@/components/features/i18n/language-selector";

/** Barra superior para visitantes no marketplace público. */
export function PublicAppBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-ecopet-gray/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0f1419]/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <EcoPetLogo href="/" size="sm" showText />
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link
            href="/marketplace"
            className={
              pathname.startsWith("/marketplace")
                ? "font-semibold text-ecopet-green"
                : "text-ecopet-gray hover:text-ecopet-green"
            }
          >
            {t("common.marketplace")}
          </Link>
          <Link href="/termos-de-uso" className="text-ecopet-gray hover:text-ecopet-green">
            {t("common.terms")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelector compact className="shrink-0" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("common.signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cadastro">{t("common.createAccount")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
