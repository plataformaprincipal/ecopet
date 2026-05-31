"use client";

import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeIndicatorsProps {
  items: { label: string; value: string; status: "online" | "warning" | "offline" }[];
}

const statusColors = {
  online: "bg-ecopet-green",
  warning: "bg-amber-500",
  offline: "bg-ecopet-gray/40",
};

export function RealtimeIndicators({ items }: RealtimeIndicatorsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 rounded-full border border-ecopet-gray/10 bg-white px-3 py-1.5 text-xs dark:bg-white/5">
          <span className={cn("h-2 w-2 rounded-full animate-pulse", statusColors[item.status])} />
          <Activity className="h-3 w-3 text-ecopet-gray" />
          <span className="text-ecopet-gray">{item.label}:</span>
          <span className="font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 rounded-2xl bg-ecopet-gray/10" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-ecopet-gray/10" />)}
      </div>
      <div className="h-64 rounded-2xl bg-ecopet-gray/10" />
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ecopet-gray/20 p-8 text-center">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-ecopet-gray">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
