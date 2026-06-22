"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ONG_NAV_ITEMS, isOngNavActive } from "@/lib/ong/nav";
import type { OngAccessLevel } from "@/lib/ong/access";
import { OngStatusBadge } from "./ong-status-badge";

type OngSidebarProps = {
  ongName: string;
  accessLevel: OngAccessLevel;
  accountStatus: string;
  verificationStatus?: string | null;
};

export function OngSidebar({
  ongName,
  accessLevel,
  accountStatus,
  verificationStatus,
}: OngSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 lg:flex lg:flex-col">
      <div className="border-b border-zinc-200/80 px-5 py-6 dark:border-white/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Área da ONG
        </p>
        <h2 className="mt-1 truncate font-display text-lg font-semibold text-zinc-900 dark:text-white">
          {ongName}
        </h2>
        <div className="mt-3">
          <OngStatusBadge
            accountStatus={accountStatus}
            verificationStatus={verificationStatus}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação da ONG">
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
                "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                active
                  ? "bg-emerald-700 text-white shadow-sm dark:bg-emerald-600"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white",
                locked && "opacity-60"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight">{item.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-snug",
                    active ? "text-white/70" : "text-zinc-400"
                  )}
                >
                  {locked ? "Disponível após aprovação" : item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
