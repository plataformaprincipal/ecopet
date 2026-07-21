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
  emerald: "text-ecopet-green bg-ecopet-green/10",
  sky: "text-ep-info bg-ep-info/10",
  violet: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
  amber: "text-ep-warning bg-ep-warning/10",
  rose: "text-ep-danger bg-ep-danger/10",
  zinc: "text-ecopet-gray bg-ecopet-gray/10 dark:text-white/70",
};

export function PetOsCard({ title, icon: Icon, accent = "emerald", href, className, children }: PetOsCardProps) {
  const header = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-ecopet-dark dark:text-white">{title}</h3>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", ACCENTS[accent])}>
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
    </div>
  );

  const body = (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-5 shadow-[var(--shadow-xs)] transition-[transform,box-shadow] duration-[var(--duration-normal)] dark:border-white/10 dark:bg-ecopet-dark-card",
        href && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      {header}
      {children}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[var(--radius-xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green"
      >
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
        <p className="font-display text-2xl font-bold tracking-tight text-ecopet-dark dark:text-white">{value}</p>
        {delta ? (
          <span
            className={cn(
              "text-xs font-medium",
              delta.positive ? "text-ep-success" : "text-ep-danger"
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-ecopet-gray dark:text-white/55">{hint}</p> : null}
    </div>
  );
}

export function PetOsEmpty({ message }: { message: string }) {
  return <p className="text-sm text-ecopet-gray dark:text-white/55">{message}</p>;
}
