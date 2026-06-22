"use client";

export function OngPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60"
          />
        ))}
      </div>
      <div className="h-40 rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60" />
    </div>
  );
}

export function OngCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
      <div className="aspect-video rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
