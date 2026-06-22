"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CLIENT_NAV_ITEMS, isClientNavActive } from "@/lib/client/nav";

type ClientSidebarProps = {
  userName: string;
};

export function ClientSidebar({ userName }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 lg:flex lg:flex-col">
      <div className="border-b border-zinc-200/80 px-5 py-6 dark:border-white/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Área do Cliente
        </p>
        <h2 className="mt-1 truncate font-display text-lg font-semibold text-zinc-900 dark:text-white">
          Olá, {userName.split(" ")[0]}
        </h2>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Navegação do cliente">
        {CLIENT_NAV_ITEMS.map((item) => {
          const active = isClientNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    active ? "text-white/70 dark:text-zinc-600" : "text-zinc-400"
                  )}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
