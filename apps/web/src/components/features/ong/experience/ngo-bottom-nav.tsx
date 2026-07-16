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
  const items = NGO_EXPERIENCE_BOTTOM_NAV.slice(0, 5);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 lg:hidden"
      aria-label={t("ngoArea.area")}
    >
      <div
        className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch px-1 pt-1 sm:h-[4.5rem]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const active = isNgoExperienceNavActive(pathname, item.href);
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5",
                "text-[11px] font-semibold leading-none whitespace-nowrap overflow-hidden",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecopet-green",
                active ? "text-rose-500" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden />
              <span className="max-w-full truncate px-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
