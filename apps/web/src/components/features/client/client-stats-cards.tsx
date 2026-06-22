"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientStatsCardsProps = {
  items: Array<{ label: string; value: string | number; icon: LucideIcon }>;
};

export function ClientStatsCards({ items }: ClientStatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">{label}</p>
            <Icon className="h-4 w-4 text-zinc-400" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

type ClientFeedbackProps = {
  message: string;
  type?: "success" | "error";
  className?: string;
};

export function ClientFeedback({ message, type = "success", className }: ClientFeedbackProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "rounded-xl px-4 py-2 text-sm",
        type === "success"
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
        className
      )}
    >
      {message}
    </p>
  );
}
