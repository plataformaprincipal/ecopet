"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PREMIUM_MOBILE_NAV, isPremiumNavActive } from "@/lib/public-client/premium-nav";
import { useTranslation } from "@/providers/i18n-provider";

export function PublicMobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ecopet-gray/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-ecopet-dark-bg/95 lg:hidden"
      aria-label={t("nav.home")}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {PREMIUM_MOBILE_NAV.map((item) => {
          const active = isPremiumNavActive(pathname, item.href);
          const Icon = item.icon;
          const label = t(item.mobileLabelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecopet-green",
                active
                  ? "text-ecopet-green"
                  : "text-ecopet-gray dark:text-white/50"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-105")} aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
