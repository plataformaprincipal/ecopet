"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AnalyticsCardsProps {
  items: { label: string; value: string | number; trend?: string; icon?: LucideIcon; variant?: "default" | "success" | "warning" | "critical" }[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const variants = {
  default: "border-ecopet-gray/10",
  success: "border-ecopet-green/30 bg-ecopet-green/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  critical: "border-red-500/30 bg-red-500/5",
};

export function AnalyticsCards({ items, columns = 3, className }: AnalyticsCardsProps) {
  return (
    <div className={cn(
      "grid gap-3",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn("rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/5", variants[item.variant ?? "default"])}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ecopet-gray">{item.label}</p>
                <p className="mt-1 font-display text-xl font-bold truncate">{item.value}</p>
                {item.trend && <p className="mt-1 text-xs text-ecopet-green">{item.trend}</p>}
              </div>
              {Icon && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ecopet-green/10">
                  <Icon className="h-4 w-4 text-ecopet-green" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
