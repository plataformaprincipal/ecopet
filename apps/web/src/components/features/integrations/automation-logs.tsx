"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AutomationLog, LogEventType } from "@/lib/integrations/types";

interface AutomationLogsProps {
  logs: AutomationLog[];
  compact?: boolean;
}

const statusColors: Record<LogEventType, string> = {
  success: "text-ecopet-green",
  alert: "text-amber-600",
  error: "text-red-600",
  auto_action: "text-blue-600",
  pending: "text-ecopet-gray",
  human_review: "text-purple-600",
};

const statusLabels: Record<LogEventType, string> = {
  success: "Sucesso",
  alert: "Alerta",
  error: "Erro",
  auto_action: "Ação automática",
  pending: "Pendente",
  human_review: "Revisão humana",
};

export function AutomationLogs({ logs, compact }: AutomationLogsProps) {
  const [filter, setFilter] = useState<LogEventType | "all">("all");
  const filtered = filter === "all" ? logs : logs.filter((l) => l.status === filter);

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button type="button" onClick={() => setFilter("all")} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", filter === "all" ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>Todos</button>
          {(Object.keys(statusLabels) as LogEventType[]).map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", filter === s ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}>{statusLabels[s]}</button>
          ))}
        </div>
      )}
      <div className="divide-y divide-ecopet-gray/10 rounded-[16px] border border-ecopet-gray/10 dark:divide-white/10 dark:border-white/10">
        {filtered.map((log) => (
          <div key={log.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="caption-text">{log.date} {log.time}</span>
                <span className={cn("text-xs font-semibold", statusColors[log.status])}>{statusLabels[log.status]}</span>
              </div>
              <p className="mt-1 font-medium">{log.event}</p>
              <p className="caption-text">{log.module}{log.robot && ` · ${log.robot}`}{log.integration && ` · ${log.integration}`}</p>
            </div>
            <div className="text-right text-sm">
              <p>{log.actionTaken}</p>
              {log.recommendation && <p className="caption-text text-ecopet-green">{log.recommendation}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
