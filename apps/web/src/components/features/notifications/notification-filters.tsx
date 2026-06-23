"use client";

import { cn } from "@/lib/utils";
import type { NotificationFilter } from "@/lib/notifications/types";
import { FILTER_OPTIONS } from "@/lib/notifications/config";
import { useTranslation } from "@/providers/i18n-provider";

interface NotificationFiltersProps {
  active: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
  counts: Partial<Record<NotificationFilter, number>>;
}

export function NotificationFilters({ active, onChange, counts }: NotificationFiltersProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label={t("notifications.filters.label")}
    >
      {FILTER_OPTIONS.map(({ id, labelKey }) => {
        const count = counts[id];
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
              isActive
                ? "bg-ecopet-green text-white shadow-sm"
                : "bg-white text-ecopet-gray ring-1 ring-ecopet-gray/15 hover:bg-ecopet-green/5 dark:bg-white/5 dark:text-white/80 dark:ring-white/10"
            )}
          >
            {t(labelKey)}
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
