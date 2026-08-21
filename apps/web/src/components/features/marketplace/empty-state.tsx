"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, href, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-ecopet-gray/20 bg-[var(--ep-bg-elevated)] px-6 py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ecopet-green/10">
        <Icon className="h-8 w-8 text-ecopet-green" />
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--ep-fg)]">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--ep-fg-muted)]">{description}</p>}
      {actionLabel && href ? (
        <Button asChild className="mt-6">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      ) : actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
