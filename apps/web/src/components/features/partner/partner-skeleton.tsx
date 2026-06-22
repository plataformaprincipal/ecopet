import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PartnerSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-2xl", className)} />;
}

export function PartnerPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <PartnerSkeleton className="h-8 w-64" />
        <PartnerSkeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <PartnerSkeleton key={i} className="h-40" />
        ))}
      </div>
      <PartnerSkeleton className="h-64" />
    </div>
  );
}

export function PartnerCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PartnerSkeleton key={i} className="h-52" />
      ))}
    </div>
  );
}
