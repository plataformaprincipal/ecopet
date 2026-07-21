import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function Grid({
  count,
  className,
  children,
}: {
  count: number;
  className?: string;
  children: (i: number) => ReactNode;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{children(i)}</div>
      ))}
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("ep-container space-y-6 py-6", className)} aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-ecopet-gray/10 p-5 dark:border-white/10",
        className
      )}
    >
      <Skeleton className="mb-4 h-36 w-full rounded-xl" />
      <Skeleton className="mb-2 h-5 w-3/5" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-4 h-9 w-28" />
    </div>
  );
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      <Grid count={rows} className="space-y-3">
        {() => (
          <div className="flex items-center gap-3 rounded-xl border border-ecopet-gray/10 p-3 dark:border-white/10">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        )}
      </Grid>
    </div>
  );
}

export function FeedSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto max-w-xl space-y-4", className)} aria-busy="true">
      <Grid count={3} className="space-y-4">
        {() => (
          <div className="rounded-[var(--radius-lg)] border border-ecopet-gray/10 p-4 dark:border-white/10">
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        )}
      </Grid>
    </div>
  );
}

export function MarketplaceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      <Skeleton className="h-12 w-full max-w-md rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <PetCardSkeleton />
        <PetCardSkeleton />
        <PetCardSkeleton />
        <PetCardSkeleton />
      </div>
    </div>
  );
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-[420px] flex-col rounded-[var(--radius-lg)] border border-ecopet-gray/10 dark:border-white/10", className)} aria-busy="true">
      <div className="border-b border-ecopet-gray/10 p-4 dark:border-white/10">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
        <Skeleton className="h-10 w-1/2 rounded-2xl" />
        <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
        <Skeleton className="h-10 w-2/5 rounded-2xl" />
      </div>
      <div className="border-t border-ecopet-gray/10 p-3 dark:border-white/10">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function TableSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-ecopet-gray/10 dark:border-white/10", className)} aria-busy="true">
      <Skeleton className="h-12 w-full rounded-none" />
      <Grid count={rows} className="divide-y divide-ecopet-gray/10 dark:divide-white/10">
        {() => (
          <div className="flex gap-3 p-3">
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        )}
      </Grid>
    </div>
  );
}

export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-md space-y-4", className)} aria-busy="true">
      <Grid count={fields} className="space-y-4">
        {() => (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        )}
      </Grid>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export function PetCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-ecopet-gray/10 dark:border-white/10", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}
