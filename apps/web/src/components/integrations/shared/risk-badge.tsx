"use client";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/integrations/types";

const styles: Record<RiskLevel, string> = {
  low: "bg-ecopet-green/10 text-ecopet-green border-ecopet-green/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  high: "bg-red-500/10 text-red-600 border-red-500/20",
};

const labels: Record<RiskLevel, string> = {
  low: "Risco baixo",
  medium: "Risco médio",
  high: "Risco alto",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", styles[level], className)}>
      {labels[level]}
    </span>
  );
}
