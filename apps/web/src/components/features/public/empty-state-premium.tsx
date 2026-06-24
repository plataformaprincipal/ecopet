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
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/80 px-6 py-16 text-center dark:border-white/10 dark:from-zinc-900/40 dark:to-zinc-950/40">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ecopet-green/10">
        <Icon className="h-8 w-8 text-ecopet-green" aria-hidden />
      </div>
      <h3 className="mt-6 font-display text-xl font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-8 rounded-xl">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-8 rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
