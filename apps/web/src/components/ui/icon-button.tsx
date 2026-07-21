import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  label: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-9 w-9 min-h-[36px] min-w-[36px]",
  md: "h-10 w-10 min-h-[40px] min-w-[40px]",
  lg: "h-11 w-11 min-h-[44px] min-w-[44px]",
} as const;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, size = "md", variant = "ghost", children, ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      aria-label={label}
      className={cn(sizeMap[size], className)}
      {...props}
    >
      {children}
    </Button>
  )
);
IconButton.displayName = "IconButton";
