import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PublicPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PublicPageHeader({ title, description, actions, className }: PublicPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-zinc-200/80 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
