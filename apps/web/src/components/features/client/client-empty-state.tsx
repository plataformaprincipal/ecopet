"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ClientEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function ClientEmptyState(props: ClientEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.03]",
        props.className
      )}
      role="status"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <props.icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">{props.title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {props.description}
      </p>
      {props.actionLabel && props.actionHref ? (
        <Button asChild className="mt-6" size="sm">
          <Link href={props.actionHref}>{props.actionLabel}</Link>
        </Button>
      ) : null}
      {props.actionLabel && props.onAction && !props.actionHref ? (
        <Button className="mt-6" size="sm" type="button" onClick={props.onAction}>
          {props.actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
