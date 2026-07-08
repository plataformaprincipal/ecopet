"use client";

import { cn } from "@/lib/utils";

export type AIModelOption = {
  id: string;
  label: string;
  provider: string;
  enabled?: boolean;
};

type Props = {
  models: AIModelOption[];
  value?: string;
  onChange?: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
};

export function AIModelSelector({ models, value, onChange, disabled, className }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
        className
      )}
      aria-label="Selecione um modelo"
    >
      <option value="">Selecione um modelo</option>
      {models.map((m) => (
        <option key={m.id} value={m.id} disabled={m.enabled === false}>
          {m.label} ({m.provider})
        </option>
      ))}
    </select>
  );
}
