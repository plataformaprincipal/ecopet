"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PARTNER_NAV_ITEMS, isPartnerNavActive } from "@/lib/partner/nav";
import type { PartnerAccessLevel } from "@/lib/partner/access";

type PartnerMobileNavProps = {
  accessLevel: PartnerAccessLevel;
};

/** Bottom nav parceiro — máximo 5 itens, grid igual (área operacional). */
export function PartnerMobileNav({ accessLevel }: PartnerMobileNavProps) {
  const pathname = usePathname();
  const items = PARTNER_NAV_ITEMS.slice(0, 5);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 lg:hidden"
      aria-label="Navegação móvel do parceiro"
    >
      <div
        className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch px-1 pt-1 sm:h-[4.5rem]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const active = isPartnerNavActive(pathname, item.href);
          const locked = accessLevel === "limited" && item.requiresApproval;
          const Icon = item.icon;
          const short = item.label.split(" ")[0];

          return (
            <Link
              key={item.href}
              href={locked ? "/parceiro/perfil-gestao" : item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5",
                "text-[11px] font-semibold leading-none whitespace-nowrap overflow-hidden",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecopet-green",
                active
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400",
                locked && "opacity-50"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 sm:h-6 sm:w-6", active && "scale-105")} aria-hidden />
              <span className="max-w-full truncate px-0.5">{short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
