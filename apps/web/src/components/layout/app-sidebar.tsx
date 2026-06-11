"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Rss,
  Compass,
  ShoppingBag,
  Sparkles,
  PawPrint,
  Heart,
  MessageCircle,
  Settings,
  Crown,
  Film,
  Bookmark,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/lib/constants";
import { useTranslation } from "@/providers/i18n-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { TranslationKey } from "@/lib/i18n/types";

const navLabelKeys: Record<string, TranslationKey> = {
  "/dashboard": "nav.home",
  "/feed": "nav.feed",
  "/social/explorar": "nav.explore",
  "/marketplace": "nav.marketplace",
  "/ia": "nav.ia",
  "/pets": "nav.pets",
  "/adocao": "nav.adoption",
  "/social/mensagens": "nav.chat",
};

const icons: Record<string, React.ElementType> = {
  Home,
  Rss,
  Compass,
  ShoppingBag,
  Sparkles,
  PawPrint,
  Heart,
  MessageCircle,
  Film,
  Bookmark,
  Sprout,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden w-[17rem] flex-col border-r border-ecopet-gray/10 bg-white dark:border-white/10 dark:bg-[#0a0d10] lg:flex" aria-label="Menu principal">
      <div className="border-b border-ecopet-gray/10 p-5 dark:border-white/10">
        <Logo responsive />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon] || Home;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[12px] px-4 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-ecopet-brand text-white shadow-[var(--shadow-premium)]"
                  : "text-ecopet-gray hover:bg-ecopet-green/8 hover:text-ecopet-dark dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {navLabelKeys[item.href] ? t(navLabelKeys[item.href]) : item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-ecopet-gray/10 p-3 dark:border-white/10">
        <NotificationBell variant="sidebar" showLabel label={t("nav.notifications")} />
        <Link
          href="/assinatura"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-ecopet-yellow hover:bg-ecopet-yellow/10"
        >
          <Crown className="h-5 w-5" aria-hidden /> {t("nav.premium")}
        </Link>
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-ecopet-gray hover:bg-ecopet-green/5"
        >
          <Settings className="h-5 w-5" aria-hidden /> {t("nav.settings")}
        </Link>
      </div>
    </aside>
  );
}
