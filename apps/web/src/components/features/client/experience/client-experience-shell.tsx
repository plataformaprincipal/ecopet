"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Plus, Sparkles, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import {
  CLIENT_EXPERIENCE_NAV,
  CLIENT_IMMERSIVE_ROUTES,
  CLIENT_RIGHT_PANEL_ROUTES,
  isClientExperienceNavActive,
} from "@/lib/client/experience-nav";
import { ClientExperienceSidebar } from "./client-experience-sidebar";
import { ClientBottomNav } from "./client-bottom-nav";
import { ClientTopbar } from "./client-topbar";
import { ClientRightPanel } from "./client-right-panel";

type Props = {
  userName: string;
  primaryPet?: { name: string; species?: string } | null;
  children: React.ReactNode;
};

export function ClientExperienceShell({ userName, primaryPet, children }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const immersive = CLIENT_IMMERSIVE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const showRightPanel = CLIENT_RIGHT_PANEL_ROUTES.includes(pathname);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ClientExperienceSidebar userName={userName} primaryPet={primaryPet} />

      <div className="flex min-w-0 flex-1 flex-col">
        <ClientTopbar userName={userName} onMenuClick={() => setMenuOpen(true)} />

        <div className="flex min-h-0 flex-1">
          <main
            className={cn(
              "min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-6",
              immersive ? "" : "mx-auto w-full max-w-5xl px-4 py-6"
            )}
          >
            {children}
          </main>
          {showRightPanel ? <ClientRightPanel /> : null}
        </div>
      </div>

      <ClientBottomNav />

      {/* Floating actions above bottom nav (mobile) */}
      <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col gap-2 lg:hidden">
        <Link
          href="/client/eccopet"
          aria-label={t("clientArea.shell.assistant")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </Link>
        <Link
          href="/client/social"
          aria-label={t("clientArea.shell.newPost")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg dark:bg-white dark:text-zinc-900"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </Link>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-white shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-4 dark:border-white/10">
              <span className="font-display text-lg font-semibold text-zinc-900 dark:text-white">EcoPet</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {CLIENT_EXPERIENCE_NAV.map((item) => {
                const active = isClientExperienceNavActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <Link
                href="/client/cart"
                className="mt-2 flex items-center gap-3 rounded-xl bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:bg-white/5 dark:text-zinc-300"
              >
                <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
                {t("clientArea.nav.cart")}
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
