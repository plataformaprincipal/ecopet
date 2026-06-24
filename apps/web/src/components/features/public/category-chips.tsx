"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryChip = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

type CategoryChipsProps = {
  items: CategoryChip[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function CategoryChips({ items, activeId, onSelect, className }: CategoryChipsProps) {
  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-1 scrollbar-none", className)}
      role="tablist"
      aria-label="Categorias"
    >
      {items.map((item) => {
        const active = activeId === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              active
                ? "bg-ecopet-green text-white shadow-md shadow-ecopet-green/20"
                : "border border-zinc-200/80 bg-white/80 text-zinc-700 backdrop-blur-sm hover:border-ecopet-green/30 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200"
            )}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
