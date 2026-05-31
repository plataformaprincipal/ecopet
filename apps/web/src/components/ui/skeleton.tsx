import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-ecopet-gray/10 dark:bg-white/10", className)}
      {...props}
    />
  );
}
