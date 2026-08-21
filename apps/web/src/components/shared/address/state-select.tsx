"use client";

import { BRAZILIAN_STATE_OPTIONS } from "@/lib/address/brazilian-states";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (uf: string) => void;
  className?: string;
  error?: string;
  describedBy?: string;
};

export function StateSelect({ id, value, onChange, className, error, describedBy }: Props) {
  return (
    <select
      id={id}
      className={cn(className, error && "border-red-500")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
    >
      <option value="">UF</option>
      {BRAZILIAN_STATE_OPTIONS.map((s) => (
        <option key={s.code} value={s.code}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
