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
  orientation?: "horizontal" | "vertical";
};

/**
 * Navegação principal desktop — 5 itens claros (header ou coluna).
 * Não comprime barra inferior no desktop.
 */
export function PrimaryDesktopNav({
  context = "public",
  className,
  orientation = "horizontal",
}: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = getPrimaryNavigation(context);

  return (
    <nav
      className={cn(
        orientation === "horizontal"
          ? "hidden items-center gap-1 lg:flex"
          : "hidden flex-col gap-1 lg:flex",
        className
      )}
      aria-label={t("landing.mainNav")}
    >
      {items.map((item) => {
        const active = isPrimaryNavActive(pathname, item);
        const Icon = item.icon;
        const label = t(item.labelKey);
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecopet-green",
              orientation === "vertical" && "w-full",
              active
                ? "bg-ecopet-green/10 text-ecopet-green"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
