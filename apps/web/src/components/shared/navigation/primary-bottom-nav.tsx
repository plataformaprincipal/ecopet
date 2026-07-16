"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import {
  getPrimaryNavigation,
  isPrimaryNavActive,
  type PrimaryNavContext,
} from "@/lib/navigation/primary-nav";

type Props = {
  context?: PrimaryNavContext;
  className?: string;
  /** aria-label do landmark */
  ariaLabel?: string;
};

/**
 * Bottom navigation mobile — exatamente 5 itens, grid igual, sem overflow.
 * Oculta em lg+ (desktop usa sidebar/header).
 */
export function PrimaryBottomNav({ context = "public", className, ariaLabel }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = getPrimaryNavigation(context);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-ecopet-gray/10 bg-white/95 backdrop-blur-xl",
        "dark:border-white/10 dark:bg-[#0f1419]/95",
        "lg:hidden",
        className
      )}
      aria-label={ariaLabel ?? t("landing.mainNav")}
    >
      <div
        className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch px-1 pt-1 sm:h-[4.5rem]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const active = isPrimaryNavActive(pathname, item);
          const Icon = item.icon;
          const shortLabel = t(item.mobileLabelKey);
          const fullLabel = t(item.labelKey);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={fullLabel}
              title={fullLabel}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5",
                "text-[11px] font-semibold leading-none tracking-tight",
                "whitespace-nowrap overflow-hidden",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecopet-green",
                "transition-colors duration-200",
                active ? "text-ecopet-green" : "text-ecopet-gray dark:text-white/55"
              )}
            >
              {active && (
                <span
                  className="absolute top-0 h-0.5 w-7 rounded-full bg-ecopet-green"
                  aria-hidden
                />
              )}
              <Icon
                className={cn("h-5 w-5 shrink-0 sm:h-6 sm:w-6", active && "scale-105")}
                aria-hidden
              />
              <span className="max-w-full truncate px-0.5">{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
