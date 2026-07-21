import { cn } from "@/lib/utils";

export function TableShell({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-[var(--radius-lg)] border border-ecopet-gray/12 bg-white dark:border-white/10 dark:bg-ecopet-dark-card",
        className
      )}
      {...props}
    >
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
