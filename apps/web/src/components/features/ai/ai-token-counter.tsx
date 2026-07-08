"use client";

import { cn } from "@/lib/utils";

type Props = {
  input?: number;
  output?: number;
  total?: number;
  estimatedCostUsd?: number;
  className?: string;
};

export function AITokenCounter({ input = 0, output = 0, total, estimatedCostUsd, className }: Props) {
  const sum = total ?? input + output;

  return (
    <div className={cn("flex flex-wrap gap-3 text-xs text-muted-foreground", className)}>
      <span>Input: {input.toLocaleString("pt-BR")}</span>
      <span>Output: {output.toLocaleString("pt-BR")}</span>
      <span>Total: {sum.toLocaleString("pt-BR")}</span>
      {estimatedCostUsd != null && (
        <span>Custo est.: US$ {estimatedCostUsd.toFixed(4)}</span>
      )}
    </div>
  );
}
