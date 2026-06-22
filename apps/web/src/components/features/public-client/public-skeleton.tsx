import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-2xl", className)} />;
}

export function PublicPageSkeleton() {
  return (
    <div className="space-y-6">
      <PublicSkeleton className="h-10 w-72" />
      <PublicSkeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <PublicSkeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}

export function PublicGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PublicSkeleton key={i} className="h-52" />
      ))}
    </div>
  );
}
