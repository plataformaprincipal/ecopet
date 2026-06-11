import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  demo?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  demo,
}: EmptyStateProps) {
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
      {demo && (
        <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
          Conteúdo demonstrativo — não vinculado à sua conta.
        </p>
      )}
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

export function DemoContentBanner() {
  return (
    <div
      className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100"
      role="status"
    >
      Conteúdo demonstrativo da comunidade ECOPET — publicações reais aparecerão conforme usuários publicarem.
    </div>
  );
}
