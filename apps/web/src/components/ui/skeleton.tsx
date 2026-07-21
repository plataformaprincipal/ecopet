import type * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-ecopet-gray/10 skeleton-shimmer dark:bg-white/10",
        "motion-reduce:animate-none",
        className
      )}
      aria-hidden
      {...props}
    />
  );
}
