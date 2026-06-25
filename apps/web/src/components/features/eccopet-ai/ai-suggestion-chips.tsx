"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

export function AISuggestionChips({
  suggestions,
  onSelect,
  className,
}: {
  suggestions?: string[];
  onSelect: (text: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const items =
    suggestions ??
    [
      t("ecopetAi.suggestions.s1"),
      t("ecopetAi.suggestions.s2"),
      t("ecopetAi.suggestions.s3"),
      t("ecopetAi.suggestions.s4"),
      t("ecopetAi.suggestions.s5"),
      t("ecopetAi.suggestions.s6"),
    ];
  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-2.5 text-sm text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-ecopet-green/40 hover:text-ecopet-green dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
