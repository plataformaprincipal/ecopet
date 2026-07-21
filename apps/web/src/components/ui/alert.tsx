import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-[var(--radius-md)] border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "border-ecopet-gray/20 bg-ecopet-cream/60 text-ecopet-dark dark:bg-white/5 dark:text-white",
      success: "border-ep-success/30 bg-ep-success/10 text-ep-success",
      warning: "border-ep-warning/30 bg-ep-warning/10 text-ep-warning",
      danger: "border-ep-danger/30 bg-ep-danger/10 text-ep-danger",
      info: "border-ep-info/30 bg-ep-info/10 text-ep-info",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm opacity-90", className)} {...props} />;
}
