import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ClientPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function ClientPageHeader({ title, description, actions, className }: ClientPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-ecopet-gray/12 pb-6 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ecopet-dark dark:text-white sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ecopet-gray dark:text-white/65">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
