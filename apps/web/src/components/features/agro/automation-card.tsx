"use client";

import { Zap, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AutomationRule } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

interface AutomationCardProps {
  rule: AutomationRule;
}

export function AutomationCard({ rule }: AutomationCardProps) {
  return (
    <article className="rounded-2xl border border-ecopet-gray/10 p-4 dark:bg-white/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-ecopet-yellow" />
          <h3 className="font-semibold">{rule.name}</h3>
        </div>
        <Badge className={cn(rule.status === "active" ? "bg-ecopet-green text-white" : rule.status === "triggered" ? "bg-amber-500 text-white" : "")}>
          {rule.status}
        </Badge>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div><dt className="inline text-ecopet-gray">Gatilho: </dt><dd className="inline">{rule.trigger}</dd></div>
        <div><dt className="inline text-ecopet-gray">Condição: </dt><dd className="inline">{rule.condition}</dd></div>
        <div><dt className="inline text-ecopet-gray">Ação: </dt><dd className="inline font-medium text-ecopet-green">{rule.action}</dd></div>
      </dl>
      <p className="mt-2 flex items-center gap-1 text-xs text-ecopet-gray"><Clock className="h-3 w-3" /> Última execução: {new Date(rule.lastRun).toLocaleString("pt-BR")}</p>
      {rule.logs.length > 0 && (
        <div className="mt-2 rounded-lg bg-ecopet-gray/5 p-2 text-[10px] text-ecopet-gray">
          {rule.logs.slice(-2).map((l, i) => <p key={i}>{l}</p>)}
        </div>
      )}
    </article>
  );
}
