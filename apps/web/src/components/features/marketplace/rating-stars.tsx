"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function RatingStars({ rating, size = "sm", showValue = true, className }: RatingStarsProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Star className={cn(iconSize, "fill-ecopet-yellow text-ecopet-yellow")} />
      {showValue && <span className="text-xs font-semibold text-ecopet-dark dark:text-white">{rating.toFixed(1)}</span>}
    </span>
  );
}
