"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Button } from "@/components/ui/button";

/** Barra superior para visitantes no marketplace público. */
export function PublicAppBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ecopet-gray/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0f1419]/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <EcoPetLogo href="/" size="sm" showText />
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link
            href="/marketplace"
            className={pathname.startsWith("/marketplace") ? "font-semibold text-ecopet-green" : "text-ecopet-gray hover:text-ecopet-green"}
          >
            Marketplace
          </Link>
          <Link href="/termos-de-uso" className="text-ecopet-gray hover:text-ecopet-green">
            Termos
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cadastro">Criar Conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
