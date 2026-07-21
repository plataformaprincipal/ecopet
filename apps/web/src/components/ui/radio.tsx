import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(({ className, ...props }, ref) => (
  <input
    type="radio"
    ref={ref}
    className={cn(
      "h-4 w-4 border-ecopet-gray/40 text-ecopet-green focus:ring-2 focus:ring-ecopet-green/30 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Radio.displayName = "Radio";
