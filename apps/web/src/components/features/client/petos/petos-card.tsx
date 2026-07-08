"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PetOsCardProps = {
  title: string;
  icon: LucideIcon;
  accent?: "emerald" | "sky" | "violet" | "amber" | "rose" | "zinc";
  href?: string;
  className?: string;
  children: React.ReactNode;
};

const ACCENTS: Record<NonNullable<PetOsCardProps["accent"]>, string> = {
  emerald: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  sky: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
  violet: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
  amber: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  rose: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
  zinc: "text-zinc-600 bg-zinc-500/10 dark:text-zinc-300",
};

export function PetOsCard({ title, icon: Icon, accent = "emerald", href, className, children }: PetOsCardProps) {
  const header = (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", ACCENTS[accent])}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
    </div>
  );

  const body = (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition dark:border-white/10 dark:bg-zinc-900/60",
        href && "hover:shadow-md",
        className
      )}
    >
      {header}
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl">
        {body}
      </Link>
    );
  }
  return body;
}

export function PetOsMetric({
  value,
  hint,
  delta,
}: {
  value: string | number;
  hint?: string;
  delta?: { value: string; positive?: boolean };
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
        {delta ? (
          <span
            className={cn(
              "text-xs font-medium",
              delta.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function PetOsEmpty({ message }: { message: string }) {
  return <p className="text-sm text-zinc-500">{message}</p>;
}
