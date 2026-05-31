"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AgroStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "warning" | "success" | "critical";
  className?: string;
}

const variants = {
  default: "border-ecopet-gray/10",
  warning: "border-amber-500/30 bg-amber-500/5",
  success: "border-ecopet-green/30 bg-ecopet-green/5",
  critical: "border-red-500/30 bg-red-500/5",
};

export function AgroStatCard({ label, value, icon: Icon, trend, variant = "default", className }: AgroStatCardProps) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/5", variants[variant], className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ecopet-gray">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          {trend && <p className="mt-1 text-xs text-ecopet-green">{trend}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ecopet-green/10">
          <Icon className="h-5 w-5 text-ecopet-green" />
        </div>
      </div>
    </div>
  );
}
