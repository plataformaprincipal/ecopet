import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[12px] border border-ecopet-gray/20 bg-white px-4 text-sm transition-colors placeholder:text-ecopet-gray/50 focus:border-ecopet-green focus:outline-none focus:ring-2 focus:ring-ecopet-green/20 dark:border-white/10 dark:bg-white/5 dark:text-white",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
