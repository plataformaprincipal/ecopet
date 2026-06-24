import { cn } from "@/lib/utils";

type SkeletonCardProps = {
  variant?: "post" | "product" | "service" | "tool";
  className?: string;
};

export function SkeletonCard({ variant = "product", className }: SkeletonCardProps) {
  if (variant === "post") {
    return (
      <div
        className={cn("animate-pulse overflow-hidden rounded-[20px] border border-zinc-200/60 bg-white dark:border-white/10 dark:bg-zinc-900/40", className)}
        aria-hidden
      >
        <div className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-2 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("animate-pulse overflow-hidden rounded-[20px] border border-zinc-200/60 bg-white dark:border-white/10 dark:bg-zinc-900/40", className)}
      aria-hidden
    >
      <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-8 w-full rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, variant = "product" }: { count?: number; variant?: SkeletonCardProps["variant"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}
