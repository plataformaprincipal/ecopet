"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { useServerCart } from "@/hooks/use-server-cart";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { ThemeToggle } from "@/components/shared/theme/theme-toggle";

/** Barra superior para visitantes no marketplace público. */
export function PublicAppBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { itemCount } = useServerCart();
  const { isAuthenticated, loading } = useFoundationSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ep-border)] bg-[var(--header)]/95 backdrop-blur">
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
          <ThemeToggle size="sm" />
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/carrinho" aria-label={t("cart.title")}>
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ecopet-yellow px-0.5 text-[9px] font-bold text-ecopet-dark">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </Button>
          {!loading && isAuthenticated ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/perfil">{t("nav.profile")}</Link>
            </Button>
          ) : !loading ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("common.signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/cadastro">{t("common.createAccount")}</Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
