import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-ecopet-green/10 text-ecopet-green",
        premium: "bg-ecopet-green/15 text-ecopet-green-800 dark:text-ecopet-green-500",
        verified: "bg-ep-info/10 text-ep-info",
        vet: "bg-ecopet-dark/10 text-ecopet-dark dark:text-ecopet-green",
        outline: "border border-ecopet-gray/30 bg-transparent text-ecopet-gray",
        secondary: "bg-ecopet-gray/10 text-ecopet-gray",
        destructive: "bg-ep-danger/10 text-ep-danger",
        success: "bg-ep-success/10 text-ep-success",
        warning: "bg-ep-warning/10 text-ep-warning",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
