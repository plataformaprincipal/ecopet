"use client";

import { Sparkles } from "lucide-react";
import type { EccoPetTool } from "@/lib/public/eccopet-tools";
import { useTranslation } from "@/providers/i18n-provider";
import { AISuggestionChips } from "./ai-suggestion-chips";
import { AIToolGrid } from "./ai-tool-grid";

export function AIEmptyState({
  onSendSuggestion,
  onSelectTool,
  suggestions,
}: {
  onSendSuggestion: (text: string) => void;
  onSelectTool: (tool: EccoPetTool) => void;
  suggestions?: string[];
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-ecopet-green to-emerald-600 text-white shadow-lg shadow-ecopet-green/25">
        <Sparkles className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-white">
        {t("ecopetAi.greeting")}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-500">
        {t("ecopetAi.greetingSub")}
      </p>

      <AISuggestionChips
        suggestions={suggestions}
        onSelect={onSendSuggestion}
        className="mt-6"
      />

      <div className="mt-8 w-full text-left">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("ecopetAi.toolsTitle")}
        </h2>
        <AIToolGrid onSelectTool={onSelectTool} />
      </div>
    </div>
  );
}
