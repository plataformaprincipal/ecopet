"use client";

import { cn } from "@/lib/utils";

export type AIAgentOption = {
  id: string;
  name: string;
  description?: string;
};

type Props = {
  agents: AIAgentOption[];
  value?: string;
  onChange?: (agentId: string) => void;
  disabled?: boolean;
  className?: string;
};

export function AIAgentSelector({ agents, value, onChange, disabled, className }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
        className
      )}
      aria-label="Selecione um agente"
    >
      <option value="">Selecione um agente</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
