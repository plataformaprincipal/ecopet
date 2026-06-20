"use client";

import type { LucideIcon } from "lucide-react";
import { Sparkles, User, UserRound, Users, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLIENT_GENDER_OPTIONS } from "@/schemas/auth";

export const GENDER_VALIDATION_MESSAGE =
  "Informe o gênero ou selecione uma das opções disponíveis.";

const GENDER_META: Record<
  string,
  { icon: LucideIcon; description: string }
> = {
  MASCULINO: {
    icon: User,
    description: "Identidade masculina",
  },
  FEMININO: {
    icon: UserRound,
    description: "Identidade feminina",
  },
  NAO_BINARIO: {
    icon: Users,
    description: "Identidade fora do binário masculino/feminino",
  },
  NAO_DECLARAR: {
    icon: ShieldOff,
    description: "Prefiro não informar publicamente",
  },
  OUTRO: {
    icon: Sparkles,
    description: "Desejo informar outra identidade",
  },
};

type RegisterGenderSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
};

export function RegisterGenderSelector({
  value,
  onChange,
  error,
  id = "client-gender-group",
}: RegisterGenderSelectorProps) {
  return (
    <fieldset className="w-full min-w-0">
      <legend className="mb-3 text-sm font-medium">
        Gênero *
      </legend>
      <div
        id={id}
        role="radiogroup"
        aria-label="Gênero"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {CLIENT_GENDER_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const inputId = `client-gender-${opt.value.toLowerCase()}`;
          const meta = GENDER_META[opt.value];
          const Icon = meta?.icon ?? User;

          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={cn(
                "group relative flex min-h-[7.5rem] min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all duration-300",
                "hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
                "focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2",
                selected
                  ? "scale-[1.02] border-emerald-600 bg-gradient-to-b from-emerald-50 to-white shadow-md ring-2 ring-emerald-500/20 dark:from-emerald-950/40 dark:to-ecopet-dark-card"
                  : "border-gray-200 bg-white dark:border-white/10 dark:bg-ecopet-dark-card"
              )}
            >
              <input
                id={inputId}
                type="radio"
                name="client-gender"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
                aria-checked={selected}
              />
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
                  selected
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:bg-white/10 dark:text-white/70"
                )}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="block text-sm font-semibold leading-tight text-ecopet-dark dark:text-white">
                {opt.label}
              </span>
              <span className="block text-xs leading-snug text-muted-foreground">
                {meta?.description}
              </span>
              {selected && (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-600 motion-safe:animate-pulse"
                  aria-hidden
                />
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </fieldset>
  );
}
