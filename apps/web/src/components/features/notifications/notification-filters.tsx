"use client";

import { cn } from "@/lib/utils";
import type { NotificationFilter } from "@/lib/notifications/types";
import { FILTER_OPTIONS } from "@/lib/notifications/config";

interface NotificationFiltersProps {
  active: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
  counts: Partial<Record<NotificationFilter, number>>;
}

export function NotificationFilters({ active, onChange, counts }: NotificationFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTER_OPTIONS.map(({ id, label }) => {
        const count = counts[id];
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all",
              isActive
                ? "bg-ecopet-green text-white shadow-sm"
                : "bg-white text-ecopet-gray ring-1 ring-ecopet-gray/15 hover:bg-ecopet-green/5 dark:bg-white/5 dark:text-white/80 dark:ring-white/10"
            )}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className={cn("ml-1.5", isActive ? "text-white/80" : "text-ecopet-green")}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
