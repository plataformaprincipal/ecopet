"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  Sparkles,
  Sprout,
  Film,
  Bookmark,
  Settings,
  Crown,
  Heart,
  Radio,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { MAIN_NAV, SECONDARY_NAV, isNavActive } from "@/lib/navigation/main-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useTranslation } from "@/providers/i18n-provider";

const secondaryIcons: Record<string, React.ElementType> = {
  MessageCircle,
  Bell: MessageCircle,
  Sparkles,
  Sprout,
  Film,
  Bookmark,
  Heart,
  Radio,
  Calendar,
};

export function MainNavigation() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ecopet-dark/20 bg-ecopet-dark dark:border-white/10 lg:flex">
      <div className="p-6">
        <Logo href="/inicio" responsive />
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label={t("landing.mainNav")}>
        {MAIN_NAV.map(({ href, labelKey, icon: Icon, ...item }) => {
          const active = isNavActive(pathname, { href, labelKey, icon: Icon, ...item });
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-ecopet-green text-white shadow-md shadow-ecopet-green/30"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ecopet-gray/10 p-3 dark:border-white/10">
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-white/50">{t("common.more")}</p>
        <div className="space-y-0.5">
          <NotificationBell variant="sidebar" showLabel label={t("nav.notifications")} />
          {SECONDARY_NAV.filter((s) => s.href !== "/notificacoes").map((item) => {
            const Icon = secondaryIcons[item.icon] || MessageCircle;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-ecopet-green/20 text-ecopet-yellow" : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
          <Link
            href="/assinatura"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ecopet-yellow hover:bg-ecopet-yellow/10"
          >
            <Crown className="h-4 w-4" /> {t("nav.premium")}
          </Link>
          <Link
            href="/configuracoes"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ecopet-gray hover:bg-ecopet-green/5"
          >
            <Settings className="h-4 w-4" /> {t("nav.settings")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
