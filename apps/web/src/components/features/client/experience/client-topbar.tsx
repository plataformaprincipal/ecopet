"use client";

import Link from "next/link";
import { Menu, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSelector } from "@/components/features/i18n/language-selector";
import { NotificationBell } from "@/components/features/notifications/notification-bell";

type Props = {
  userName: string;
  onMenuClick: () => void;
};

export function ClientTopbar({ userName, onMenuClick }: Props) {
  const { t } = useTranslation();
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/85">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={t("clientArea.shell.menu")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <Link href="/client" className="font-display text-base font-semibold text-zinc-900 dark:text-white lg:hidden">
        EcoPet
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        <LanguageSelector compact />
        <NotificationBell variant="header" />
        <Link
          href="/client/cart"
          aria-label={t("clientArea.nav.cart")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
        </Link>
        <Link
          href="/client/profile"
          aria-label={t("clientArea.nav.profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ecopet-green/15 text-sm font-semibold text-ecopet-green"
        >
          {initials || "U"}
        </Link>
      </div>
    </header>
  );
}
