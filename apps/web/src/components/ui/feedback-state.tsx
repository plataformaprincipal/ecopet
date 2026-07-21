import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackVariant = "empty" | "error" | "success" | "info";

const ICONS: Record<FeedbackVariant, LucideIcon> = {
  empty: Info,
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const STYLES: Record<FeedbackVariant, string> = {
  empty: "border-ecopet-green/25 from-ecopet-green/[0.04]",
  error: "border-ep-danger/30 from-ep-danger/[0.06]",
  success: "border-ep-success/30 from-ep-success/[0.06]",
  info: "border-ep-info/30 from-ep-info/[0.06]",
};

const ICON_STYLES: Record<FeedbackVariant, string> = {
  empty: "bg-ecopet-green/10 text-ecopet-green",
  error: "bg-ep-danger/10 text-ep-danger",
  success: "bg-ep-success/10 text-ep-success",
  info: "bg-ep-info/10 text-ep-info",
};

export function FeedbackState({
  variant = "empty",
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: {
  variant?: FeedbackVariant;
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  const Icon = icon ?? ICONS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-xl)] border bg-gradient-to-b to-transparent px-6 py-14 text-center",
        STYLES[variant],
        className
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", ICON_STYLES[variant])}>
        <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-ecopet-dark dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ecopet-gray dark:text-white/65">{description}</p>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-6 rounded-xl" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <Button className="mt-6 rounded-xl" size="sm" type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
