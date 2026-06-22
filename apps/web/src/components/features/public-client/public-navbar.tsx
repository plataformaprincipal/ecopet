"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { PUBLIC_CLIENT_NAV, isPublicClientNavActive } from "@/lib/public-client/nav";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <EcoPetLogo href="/" size="sm" showText />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Navegação principal EcoPet"
        >
          {PUBLIC_CLIENT_NAV.map((item) => {
            const active = isPublicClientNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector compact className="hidden shrink-0 sm:flex" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cadastro">Criar conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
