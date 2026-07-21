import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStatePremiumProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function EmptyStatePremium({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStatePremiumProps) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-ecopet-green/25 bg-gradient-to-b from-ecopet-green/[0.04] to-transparent px-6 py-16 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ecopet-green/10 shadow-[var(--shadow-xs)]">
        <Icon className="h-8 w-8 text-ecopet-green" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="mt-6 font-display text-xl font-semibold text-ecopet-dark dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ecopet-gray dark:text-white/65">{description}</p>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-8 rounded-xl">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <Button className="mt-8 rounded-xl" type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
