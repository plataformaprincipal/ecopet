"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ONG_NAV_ITEMS, isOngNavActive } from "@/lib/ong/nav";
import type { OngAccessLevel } from "@/lib/ong/access";

type OngMobileNavProps = {
  accessLevel: OngAccessLevel;
};

export function OngMobileNav({ accessLevel }: OngMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 lg:hidden"
      aria-label="Menu mobile da ONG"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {ONG_NAV_ITEMS.map((item) => {
          const active = isOngNavActive(pathname, item.href);
          const locked =
            (accessLevel === "limited" || accessLevel === "blocked") && item.requiresApproval;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={locked ? "/ong/perfil-gestao" : item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition",
                active
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                locked && "opacity-50"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
