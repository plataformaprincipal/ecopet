"use client";

import Link from "next/link";
import { AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgroStore } from "@/store/agro-store";
import type { AgroAlert } from "@/lib/agro/types";
import { cn } from "@/lib/utils";

const priorityConfig = {
  critical: { color: "border-red-500/50 bg-red-500/5", badge: "bg-red-500 text-white" },
  high: { color: "border-amber-500/50 bg-amber-500/5", badge: "bg-amber-500 text-white" },
  medium: { color: "border-blue-500/30 bg-blue-500/5", badge: "bg-blue-500 text-white" },
  low: { color: "border-ecopet-gray/20", badge: "bg-ecopet-gray/20" },
};

interface AlertCenterProps {
  alerts: AgroAlert[];
  compact?: boolean;
}

export function AlertCenter({ alerts, compact }: AlertCenterProps) {
  const { alertFilter, setAlertFilter } = useAgroStore();
  const filtered = alertFilter === "all" ? alerts : alerts.filter((a) => a.priority === alertFilter);

  return (
    <div>
      {!compact && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAlertFilter(f)}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold", alertFilter === f ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10")}
            >
              {f === "all" ? "Todos" : f}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((a) => {
          const cfg = priorityConfig[a.priority];
          return (
            <div key={a.id} className={cn("rounded-2xl border p-4", cfg.color)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <h3 className="font-semibold">{a.title}</h3>
                </div>
                <Badge className={cfg.badge}>{a.priority}</Badge>
              </div>
              <p className="mt-2 text-sm text-ecopet-gray">{a.description}</p>
              <p className="mt-2 flex items-start gap-1 text-xs"><Sparkles className="h-3 w-3 shrink-0 text-ecopet-yellow" /> {a.aiRecommendation}</p>
              {!compact && (
                <>
                  <p className="mt-1 text-xs"><strong>Ação:</strong> {a.suggestedAction}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-ecopet-gray">{a.source} · {a.origin}</span>
                    {a.status === "resolved" ? (
                      <CheckCircle2 className="h-4 w-4 text-ecopet-green" />
                    ) : (
                      <Link href="/agro/alertas"><Button size="sm" variant="outline">Resolver</Button></Link>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
