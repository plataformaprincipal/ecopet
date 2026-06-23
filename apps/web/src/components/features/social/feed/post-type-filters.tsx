"use client";

import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

const FILTER_TYPES = [
  "ALL",
  "PET_UPDATE",
  "GENERAL",
  "PRODUCT",
  "SERVICE",
  "ADOPTION",
  "CAMPAIGN",
  "DONATION",
  "EVENT",
  "RESCUE",
  "EDUCATIONAL",
  "URGENT",
] as const;

export type PostTypeFilter = (typeof FILTER_TYPES)[number];

export function PostTypeFilters({
  value,
  onChange,
}: {
  value: PostTypeFilter;
  onChange: (value: PostTypeFilter) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("socialFeed.filters.label")}>
      {FILTER_TYPES.map((type) => {
        const label = type === "ALL" ? t("socialFeed.filters.all") : t(`socialFeed.postTypes.${type}`);
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
              active
                ? "border-ecopet-green bg-ecopet-green/10 text-ecopet-dark"
                : "border-ecopet-gray/20 bg-white text-muted-foreground hover:border-ecopet-green/40"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
