import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-2xl", className)} />;
}

export function ClientPageSkeleton() {
  return (
    <div className="space-y-6">
      <ClientSkeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <ClientSkeleton key={i} className="h-24" />
        ))}
      </div>
      <ClientSkeleton className="h-48" />
    </div>
  );
}

export function ClientGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ClientSkeleton key={i} className="h-52" />
      ))}
    </div>
  );
}
