import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva("rounded-[var(--radius-lg)]", {
  variants: {
    variant: {
      base: "bg-white dark:bg-ecopet-dark-card",
      elevated: "bg-white shadow-[var(--shadow-md)] dark:bg-ecopet-dark-card",
      muted: "bg-ecopet-cream/80 dark:bg-white/5",
      interactive:
        "bg-white shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)] dark:bg-ecopet-dark-card",
      highlighted: "border border-ecopet-green/25 bg-ecopet-green/[0.04]",
      glass: "glass",
      dark: "bg-ecopet-dark text-white",
    },
  },
  defaultVariants: { variant: "base" },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export function Surface({ className, variant, ...props }: SurfaceProps) {
  return <div className={cn(surfaceVariants({ variant }), className)} {...props} />;
}

export { surfaceVariants };
