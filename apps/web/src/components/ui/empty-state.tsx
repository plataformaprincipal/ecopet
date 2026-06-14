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
        "flex flex-col items-center rounded-2xl border border-dashed border-ecopet-green/25 bg-gradient-to-b from-ecopet-green/[0.04] to-transparent px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ecopet-green/10 text-ecopet-green">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-bold text-ecopet-dark dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ecopet-gray">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-6" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button className="mt-6" size="sm" type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
