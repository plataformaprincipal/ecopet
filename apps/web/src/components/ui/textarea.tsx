import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[88px] w-full rounded-[var(--radius-input)] border border-ecopet-gray/25 bg-white px-4 py-3 text-sm text-ecopet-dark transition-[border-color,box-shadow] duration-[var(--duration-fast)] placeholder:text-ecopet-gray/55 focus:border-ecopet-green focus:outline-none focus:ring-2 focus:ring-ecopet-green/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
