"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { ThemeToggle } from "@/components/shared/theme/theme-toggle";
import { PrimaryDesktopNav } from "@/components/shared/navigation/primary-desktop-nav";
import { useTranslation } from "@/providers/i18n-provider";
import { getPrimaryNavigation } from "@/lib/navigation/primary-nav";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useFoundationSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const navItems = getPrimaryNavigation("public", "desktop");

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ep-border)] bg-[var(--header)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-3 px-4 sm:px-6">
        <EcoPetLogo
          href="/"
          size="sm"
          showText
          variant="light"
          responsive
          className="min-w-0 shrink"
        />

        <PrimaryDesktopNav context="public" surface="desktop" className="mx-auto hidden xl:flex" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <LanguageSelector compact className="shrink-0" />
          <ThemeToggle size="sm" />
          {!loading && isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="hidden rounded-xl sm:inline-flex">
              <Link href="/perfil">{t("nav.profile")}</Link>
            </Button>
          ) : !loading ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden rounded-xl sm:inline-flex">
                <Link href="/login">{t("common.signIn")}</Link>
              </Button>
              <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex">
                <Link href="/cadastro">{t("common.createAccount")}</Link>
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl xl:hidden"
            aria-label={menuOpen ? t("common.closeMenu") : t("common.openMenu")}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        id={menuId}
        className={cn(
          "border-t border-[var(--ep-border)] bg-[var(--header)] xl:hidden",
          "transition-[max-height,opacity] duration-200 ease-out",
          menuOpen ? "max-h-[32rem] opacity-100" : "pointer-events-none max-h-0 overflow-hidden opacity-0"
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6" aria-label={t("landing.mainNav")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[var(--ep-fg)] transition-colors hover:bg-ecopet-green/10"
              >
                <Icon className="h-5 w-5 shrink-0 text-ecopet-green" aria-hidden />
                {t(item.labelKey)}
              </Link>
            );
          })}
          <div className="mt-2 flex flex-col gap-2 border-t border-[var(--ep-border)] pt-3 sm:hidden">
            {!loading && isAuthenticated ? (
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/perfil" onClick={() => setMenuOpen(false)}>
                  {t("nav.profile")}
                </Link>
              </Button>
            ) : !loading ? (
              <>
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    {t("common.signIn")}
                  </Link>
                </Button>
                <Button asChild className="w-full rounded-xl">
                  <Link href="/cadastro" onClick={() => setMenuOpen(false)}>
                    {t("common.createAccount")}
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
