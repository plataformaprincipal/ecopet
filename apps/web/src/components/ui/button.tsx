import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-ecopet-brand text-white hover:bg-ecopet-dark shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-premium-lg)]",
        secondary: "bg-ecopet-yellow text-ecopet-dark hover:brightness-105 shadow-sm",
        outline: "border-2 border-ecopet-green bg-white text-ecopet-green hover:bg-ecopet-green/5 dark:bg-transparent",
        ghost: "hover:bg-ecopet-green/10 text-ecopet-dark dark:text-white",
        dark: "bg-ecopet-dark text-white hover:bg-ecopet-green",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
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
      className: cn(buttonVariants({ variant, size, className })),
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
        {loading ? <Spinner label="Carregando" /> : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
