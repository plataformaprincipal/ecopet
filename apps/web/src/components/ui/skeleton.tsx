import type * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-skeleton skeleton-shimmer",
        "motion-reduce:animate-none",
        className
      )}
      aria-hidden
      {...props}
    />
  );
}
