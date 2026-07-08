"use client";

import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  className?: string;
};

export function AIErrorState({
  title = "IA indisponível",
  message = "AI Provider not configured.",
  code,
  onRetry,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30", className)}
    >
      <AlertCircle className="mb-2 h-8 w-8 text-red-600" aria-hidden />
      <p className="font-medium text-red-800 dark:text-red-200">{title}</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
      {code && <p className="mt-1 text-xs text-muted-foreground">Código: {code}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
