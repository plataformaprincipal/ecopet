"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ONG_NAV_ITEMS, isOngNavActive } from "@/lib/ong/nav";
import type { OngAccessLevel } from "@/lib/ong/access";

type OngMobileNavProps = {
  accessLevel: OngAccessLevel;
};

/** Bottom nav ONG — máximo 5 itens, grid igual. */
export function OngMobileNav({ accessLevel }: OngMobileNavProps) {
  const pathname = usePathname();
  const items = ONG_NAV_ITEMS.slice(0, 5);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 lg:hidden"
      aria-label="Menu mobile da ONG"
    >
      <div
        className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch px-1 pt-1 sm:h-[4.5rem]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const active = isOngNavActive(pathname, item.href);
          const locked =
            (accessLevel === "limited" || accessLevel === "blocked") && item.requiresApproval;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={locked ? "/ong/perfil-gestao" : item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5",
                "text-[11px] font-semibold leading-none whitespace-nowrap overflow-hidden",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecopet-green",
                active
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                locked && "opacity-50"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden />
              <span className="max-w-full truncate px-0.5">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
