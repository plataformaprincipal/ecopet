"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { PrimaryDesktopNav } from "@/components/shared/navigation/primary-desktop-nav";
import { useTranslation } from "@/providers/i18n-provider";

export function PublicNavbar() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-50 border-b border-ecopet-gray/10 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-ecopet-dark-bg/85">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <EcoPetLogo href="/" size="sm" showText className="min-w-0 max-w-[min(100%,14rem)] sm:max-w-none" />

        <PrimaryDesktopNav context="public" className="hidden xl:flex" />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSelector compact className="shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={t("a11y.themeToggle")}
          >
            {isDark ? <Sun className="h-4 w-4" strokeWidth={2} /> : <Moon className="h-4 w-4" strokeWidth={2} />}
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
