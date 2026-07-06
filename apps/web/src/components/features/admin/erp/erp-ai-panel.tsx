"use client";

import type { ErpAiInsight } from "@/lib/admin/erp/types";
import { Sparkles } from "lucide-react";

export function ErpAiPanel({ insights }: { insights: ErpAiInsight[] }) {
  if (!insights.length) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum insight de IA para o período atual.
      </div>
    );
  }

  const colors = {
    high: "border-red-200 bg-red-50 dark:bg-red-950/20",
    medium: "border-amber-200 bg-amber-50 dark:bg-amber-950/20",
    low: "border-green-200 bg-green-50 dark:bg-green-950/20",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-ecopet-green" />
        Insights inteligentes (análise sobre dados reais)
      </div>
      {insights.map((i) => (
        <div key={i.id} className={`rounded-xl border p-4 ${colors[i.priority]}`}>
          <p className="font-medium">{i.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
          {i.actionHref && (
            <a href={i.actionHref} className="mt-2 inline-block text-sm text-ecopet-green hover:underline">
              Ver detalhes →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
