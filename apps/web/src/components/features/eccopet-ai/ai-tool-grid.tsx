"use client";

import { Lock } from "lucide-react";
import { ECCOPET_TOOLS, type EccoPetTool } from "@/lib/public/eccopet-tools";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslateFn } from "@/lib/i18n";

function StatusBadge({ status, t }: { status: EccoPetTool["status"]; t: TranslateFn }) {
  if (status === "coming_soon") {
    return (
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
        {t("ecopetAi.toolStatus.comingSoon")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-ecopet-green/10 px-2 py-0.5 text-[10px] font-semibold text-ecopet-green">
      {t("ecopetAi.toolStatus.ai")}
    </span>
  );
}

export function AIToolGrid({
  onSelectTool,
  className,
}: {
  onSelectTool: (tool: EccoPetTool) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3", className)}>
      {ECCOPET_TOOLS.map((tool) => {
        const disabled = tool.status === "coming_soon";
        return (
          <button
            key={tool.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTool(tool)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-2xl border border-zinc-200/70 bg-white/80 p-3.5 text-left shadow-sm backdrop-blur-md transition dark:border-white/10 dark:bg-zinc-900/50",
              disabled
                ? "cursor-not-allowed opacity-70"
                : "hover:-translate-y-0.5 hover:border-ecopet-green/40 hover:shadow-md"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ecopet-green/15 to-ecopet-yellow/15 text-ecopet-green">
                {disabled ? <Lock className="h-4 w-4" aria-hidden /> : <tool.icon className="h-4 w-4" aria-hidden />}
              </span>
              <StatusBadge status={tool.status} t={t} />
            </div>
            <p className="text-sm font-semibold leading-tight text-zinc-900 dark:text-white">{t(`ecopetAi.tools.${tool.id}.title`)}</p>
            <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500">{t(`ecopetAi.tools.${tool.id}.description`)}</p>
          </button>
        );
      })}
    </div>
  );
}
