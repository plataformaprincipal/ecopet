"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/providers/i18n-provider";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-ecopet-green/25 bg-ecopet-green/[0.04] px-6 py-12 text-center shadow-[var(--shadow-xs)] animate-fade-in dark:bg-ecopet-green/[0.06]",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-ecopet-green/10 text-ecopet-green">
        <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="font-display text-lg font-bold tracking-tight text-ecopet-dark dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ecopet-gray dark:text-white/70">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-6 rounded-[var(--radius-button)]" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button className="mt-6 rounded-[var(--radius-button)]" size="sm" type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
