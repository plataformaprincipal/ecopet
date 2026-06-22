"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PublicCategoryItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  count?: number;
};

type PublicCategoryGridProps = {
  items: PublicCategoryItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

export function PublicCategoryGrid({
  items,
  activeId,
  onSelect,
  className,
}: PublicCategoryGridProps) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6", className)}
      role="list"
      aria-label="Categorias"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeId === item.id;
        const inner = (
          <>
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <span className="mt-3 block text-sm font-semibold text-zinc-900 dark:text-white">
              {item.label}
            </span>
            {item.description ? (
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                {item.description}
              </span>
            ) : null}
            {typeof item.count === "number" ? (
              <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {item.count} disponíveis
              </span>
            ) : null}
          </>
        );

        const classNameCard = cn(
          "flex flex-col rounded-2xl border p-4 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
          active
            ? "border-zinc-900 bg-zinc-900 text-white shadow-md dark:border-white dark:bg-white dark:text-zinc-900"
            : "border-zinc-200/80 bg-white hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
        );

        if (onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={classNameCard}
              aria-label={item.label}
              data-active={active || undefined}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link key={item.id} href={item.href} role="listitem" className={classNameCard}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
