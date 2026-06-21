"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectableCardOption = {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

type PartnerSelectableCardsProps = {
  options: SelectableCardOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  name: string;
  legend: string;
  error?: string;
  columns?: 1 | 2 | 3;
};

export function PartnerSelectableCards({
  options,
  value,
  onChange,
  multiple = false,
  name,
  legend,
  error,
  columns = 2,
}: PartnerSelectableCardsProps) {
  const selectedSet = new Set(Array.isArray(value) ? value : value ? [value] : []);

  function toggle(optionValue: string) {
    if (multiple) {
      const next = new Set(selectedSet);
      if (next.has(optionValue)) next.delete(optionValue);
      else next.add(optionValue);
      onChange(Array.from(next));
      return;
    }
    onChange(optionValue);
  }

  return (
    <fieldset className="w-full min-w-0">
      <legend className="mb-3 text-sm font-medium">{legend}</legend>
      <div
        role={multiple ? "group" : "radiogroup"}
        aria-label={legend}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "grid gap-3",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {options.map((opt) => {
          const selected = selectedSet.has(opt.value);
          const inputId = `${name}-${opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          const Icon = opt.icon;

          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={cn(
                "flex min-h-[5.5rem] cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-all duration-300",
                "hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
                "focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2",
                selected
                  ? "scale-[1.01] border-emerald-600 bg-gradient-to-b from-emerald-50 to-white shadow-md ring-2 ring-emerald-500/20"
                  : "border-gray-200 bg-white"
              )}
            >
              <input
                id={inputId}
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => toggle(opt.value)}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                {Icon && (
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      selected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    )}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  {opt.description && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {opt.description}
                    </span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </fieldset>
  );
}
