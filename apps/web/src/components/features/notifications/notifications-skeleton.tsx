import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="flex gap-3 p-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
