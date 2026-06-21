"use client";

import { Building2, Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";
import type { TranslationKey } from "@/lib/i18n/types";

export type RegisterRole = "CLIENT" | "PARTNER" | "ONG";

export const REGISTER_ROLE_REQUIRED_MESSAGE = "Escolha como você deseja usar a EcoPet.";

const ROLE_OPTIONS: {
  value: RegisterRole;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: typeof UserRound;
}[] = [
  {
    value: "CLIENT",
    labelKey: "auth.role.CLIENT.label",
    descriptionKey: "auth.role.CLIENT.description",
    icon: UserRound,
  },
  {
    value: "PARTNER",
    labelKey: "auth.role.PARTNER.label",
    descriptionKey: "auth.role.PARTNER.description",
    icon: Building2,
  },
  {
    value: "ONG",
    labelKey: "auth.role.ONG.label",
    descriptionKey: "auth.role.ONG.description",
    icon: Heart,
  },
];

type RegisterRoleSelectorProps = {
  value: RegisterRole | null;
  onChange: (role: RegisterRole) => void;
  error?: string;
  id?: string;
};

export function RegisterRoleSelector({
  value,
  onChange,
  error,
  id = "register-role-group",
}: RegisterRoleSelectorProps) {
  const { t, tv } = useAuthMessages();

  return (
    <fieldset className="w-full min-w-0">
      <legend className="mb-3 text-base font-semibold text-gray-900">
        {t("auth.role.legend")}
      </legend>
      <div
        id={id}
        role="radiogroup"
        aria-label={t("auth.role.ariaLabel")}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ROLE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const Icon = opt.icon;
          const inputId = `register-role-${opt.value.toLowerCase()}`;

          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={cn(
                "group relative flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-all",
                "hover:border-green-300 hover:bg-green-50/40 hover:shadow-sm",
                "focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2",
                selected
                  ? "border-green-600 bg-green-50/80 shadow-sm"
                  : "border-gray-200 bg-white"
              )}
            >
              <input
                id={inputId}
                type="radio"
                name="register-role"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
                role="radio"
                aria-checked={selected}
              />
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                    selected
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700"
                  )}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{t(opt.labelKey)}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(opt.descriptionKey)}
                  </span>
                </div>
              </div>
              {selected && (
                <span className="absolute right-3 top-3 text-xs font-medium text-green-700" aria-hidden>
                  ✓
                </span>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
          {tv(error)}
        </p>
      )}
    </fieldset>
  );
}
