"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AiSummary } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

interface AiSummaryBlockProps {
  summary: AiSummary;
}

const priorityDot = {
  high: "bg-rose-500",
  medium: "bg-ecopet-yellow",
  low: "bg-ecopet-green/60",
};

export function AiSummaryBlock({ summary }: AiSummaryBlockProps) {
  return (
    <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-white to-ecopet-green/5 dark:from-violet-500/10 dark:via-[#0f1419] dark:to-ecopet-green/5">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 border-b border-violet-500/10 px-4 py-3 dark:border-violet-500/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Resumo Inteligente
            </p>
            <p className="font-display text-base font-bold text-ecopet-dark dark:text-white">
              {summary.headline}
            </p>
          </div>
        </div>
        <ul className="space-y-2 px-4 py-3">
          {summary.insights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-2.5 text-sm text-ecopet-gray dark:text-white/80">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", priorityDot[insight.priority])} />
              {insight.text}
            </li>
          ))}
        </ul>
        <p className="border-t border-violet-500/10 px-4 py-2 text-[10px] text-ecopet-gray/70 dark:border-violet-500/20">
          Gerado pela IA ECOPET · atualização simulada
        </p>
      </CardContent>
    </Card>
  );
}
