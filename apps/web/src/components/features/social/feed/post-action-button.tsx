"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PostActionButtonProps = {
  icon: LucideIcon;
  label: string;
  count?: number | string;
  active?: boolean;
  activeClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
};

/** Controles de interação do feed — área de toque confortável e estados visuais. */
export function PostActionButton({
  icon: Icon,
  label,
  count,
  active,
  activeClassName = "text-ecopet-green",
  onClick,
  disabled,
  title,
  className,
}: PostActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={title ?? label}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-medium transition-colors",
        "text-ecopet-gray hover:bg-ecopet-green/10 hover:text-ecopet-dark active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        "dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-offset-ecopet-dark-card",
        "motion-reduce:active:scale-100",
        active && activeClassName,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active && "fill-current")} strokeWidth={2} aria-hidden />
      {count !== undefined ? <span className="tabular-nums">{count}</span> : null}
    </button>
  );
}
