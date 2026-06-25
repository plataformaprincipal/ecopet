"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import {
  NGO_EXPERIENCE_BOTTOM_NAV,
  isNgoExperienceNavActive,
} from "@/lib/ong/experience-nav";

export function NgoBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 lg:hidden"
      aria-label={t("ngoArea.area")}
    >
      {NGO_EXPERIENCE_BOTTOM_NAV.map((item) => {
        const active = isNgoExperienceNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-rose-500" : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
