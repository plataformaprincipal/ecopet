"use client";

import { ECCOPET_TOOLS, type EccoPetTool } from "@/lib/public/eccopet-tools";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

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
      {ECCOPET_TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onSelectTool(tool)}
          className="group flex flex-col items-start gap-2 rounded-2xl border border-zinc-200/70 bg-white/80 p-3.5 text-left shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-ecopet-green/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-900/50"
        >
          <div className="flex w-full items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ecopet-green/15 to-ecopet-yellow/15 text-ecopet-green">
              <tool.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="rounded-full bg-ecopet-green/10 px-2 py-0.5 text-[10px] font-semibold text-ecopet-green">
              {t("ecopetAi.toolStatus.ai")}
            </span>
          </div>
          <p className="text-sm font-semibold leading-tight text-zinc-900 dark:text-white">{t(`ecopetAi.tools.${tool.id}.title`)}</p>
          <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500">{t(`ecopetAi.tools.${tool.id}.description`)}</p>
        </button>
      ))}
    </div>
  );
}
