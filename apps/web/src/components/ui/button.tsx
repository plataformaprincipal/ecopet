import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-[var(--duration-normal)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-ecopet-green text-white hover:bg-ecopet-green-700 active:bg-ecopet-green-800 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        primary:
          "bg-ecopet-green text-white hover:bg-ecopet-green-700 active:bg-ecopet-green-800 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        secondary:
          "bg-ecopet-green/10 text-ecopet-green-800 hover:bg-ecopet-green/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
        outline:
          "border-2 border-ecopet-green bg-transparent text-ecopet-green hover:bg-ecopet-green/5 dark:text-ecopet-green-500",
        ghost: "hover:bg-ecopet-green/10 text-ecopet-dark dark:text-white",
        dark: "bg-ecopet-dark text-white hover:bg-ecopet-green",
        destructive: "bg-ep-danger text-white hover:bg-red-700",
        success: "bg-ep-success text-white hover:bg-green-800",
        link: "text-ecopet-green underline-offset-4 hover:underline shadow-none px-0 h-auto",
      },
      size: {
        default: "h-11 min-h-[44px] px-6",
        sm: "h-9 min-h-[36px] px-4 text-xs",
        md: "h-11 min-h-[44px] px-6",
        lg: "h-12 min-h-[48px] px-8 text-base",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const shared = {
      className: cn(buttonVariants({ variant, size, className }), loading && "relative"),
      ref,
      disabled: disabled || loading,
      "aria-busy": loading || undefined,
      ...props,
    };

    if (asChild) {
      return <Comp {...shared}>{children}</Comp>;
    }

    return (
      <Comp {...shared}>
        {loading ? (
          <span className="inline-flex w-4 shrink-0 items-center justify-center" aria-hidden>
            <Spinner label="" />
          </span>
        ) : null}
        <span className={cn(loading && "inline-flex items-center gap-2")}>{children}</span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
