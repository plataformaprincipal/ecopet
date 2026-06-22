"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

type OngEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function OngEmptyState(props: OngEmptyStateProps) {
  return (
    <EmptyState
      {...props}
      className={cn(
        "border-white/10 bg-white/50 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]",
        props.className
      )}
    />
  );
}
