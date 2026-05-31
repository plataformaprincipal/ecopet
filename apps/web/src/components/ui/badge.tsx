import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-ecopet-green/10 text-ecopet-green",
        premium: "bg-ecopet-yellow/20 text-ecopet-dark",
        verified: "bg-blue-500/10 text-blue-600",
        vet: "bg-ecopet-dark/10 text-ecopet-dark dark:text-ecopet-green",
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
