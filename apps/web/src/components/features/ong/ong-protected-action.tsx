"use client";

import type { ReactNode } from "react";
import type { OngAccessLevel } from "@/lib/ong/access";
import { cn } from "@/lib/utils";

type OngProtectedActionProps = {
  accessLevel: OngAccessLevel;
  children: ReactNode;
  className?: string;
  title?: string;
};

export function OngProtectedAction({
  accessLevel,
  children,
  className,
  title = "Disponível após aprovação da ONG",
}: OngProtectedActionProps) {
  const disabled = accessLevel !== "full";

  return (
    <div
      className={cn(disabled && "pointer-events-none opacity-50", className)}
      title={disabled ? title : undefined}
      aria-disabled={disabled || undefined}
    >
      {children}
    </div>
  );
}
