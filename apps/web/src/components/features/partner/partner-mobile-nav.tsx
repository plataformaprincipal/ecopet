"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PARTNER_NAV_ITEMS, isPartnerNavActive } from "@/lib/partner/nav";
import type { PartnerAccessLevel } from "@/lib/partner/access";

type PartnerMobileNavProps = {
  accessLevel: PartnerAccessLevel;
};

export function PartnerMobileNav({ accessLevel }: PartnerMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 lg:hidden"
      aria-label="Navegação móvel do parceiro"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {PARTNER_NAV_ITEMS.map((item) => {
          const active = isPartnerNavActive(pathname, item.href);
          const locked = accessLevel === "limited" && item.requiresApproval;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={locked ? "/parceiro/perfil-gestao" : item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400",
                locked && "opacity-50"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-105")} />
              <span className="max-w-[4.5rem] truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
