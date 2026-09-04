"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { afterMs: 0, label: "Analisando..." },
  { afterMs: 2200, label: "Consultando histórico..." },
  { afterMs: 5200, label: "Preparando resultado..." },
] as const;

/**
 * Status honesto por tempo decorrido — não inventa percentual.
 */
export function AiProcessingStatus({ className }: { className?: string }) {
  const [label, setLabel] = useState<string>(STAGES[0].label);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage) =>
      window.setTimeout(() => setLabel(stage.label), stage.afterMs)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)} role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
      {label}
    </p>
  );
}
