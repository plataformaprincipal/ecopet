import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  label?: string;
}

export function Progress({ value = 0, max = 100, label, className, ...props }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-ecopet-gray/15 dark:bg-white/10", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-ecopet-green transition-[width] duration-[var(--duration-normal)] ease-[var(--easing-standard)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
