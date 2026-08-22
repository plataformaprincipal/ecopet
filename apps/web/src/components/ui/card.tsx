import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-[16px] border border-[var(--ep-border)] bg-[var(--card)] text-[var(--card-foreground)]",
  {
    variants: {
      surface: {
        base: "shadow-[var(--shadow-xs)]",
        elevated: "shadow-[var(--shadow-md)]",
        interactive:
          "shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-[var(--duration-normal)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
        highlighted: "border-ecopet-green/30 bg-ecopet-green/[0.04] shadow-[var(--shadow-sm)]",
        glass: "glass shadow-[var(--shadow-sm)]",
        dark: "border-white/10 bg-ecopet-dark text-white shadow-[var(--shadow-md)]",
      },
    },
    defaultVariants: { surface: "base" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ surface }), className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("font-display text-xl font-bold tracking-tight text-[var(--ep-fg)]", className)}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[var(--ep-fg-muted)]", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, cardVariants };
