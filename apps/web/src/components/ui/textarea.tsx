import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[88px] w-full rounded-[var(--radius-input)] border border-[var(--ep-border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--ep-fg)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] placeholder:text-[var(--ep-fg-subtle)] focus:border-ecopet-green focus:outline-none focus:ring-2 focus:ring-ecopet-green/25 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
