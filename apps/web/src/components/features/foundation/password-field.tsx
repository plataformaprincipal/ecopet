"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
  type PasswordValidationContext,
} from "@/lib/password/validate-strong-password";

const LEVEL_COLORS: Record<string, string> = {
  weak: "bg-red-500",
  medium: "bg-amber-500",
  strong: "bg-green-600",
  very_strong: "bg-green-700",
  excellent: "bg-emerald-800",
};

const LEVEL_WIDTH: Record<string, string> = {
  weak: "w-1/5",
  medium: "w-2/5",
  strong: "w-3/5",
  very_strong: "w-4/5",
  excellent: "w-full",
};

const LEVEL_TEXT: Record<string, string> = {
  weak: "text-red-600",
  medium: "text-amber-600",
  strong: "text-green-700",
  very_strong: "text-green-800",
  excellent: "text-emerald-900",
};

type FoundationPasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  context?: PasswordValidationContext;
  required?: boolean;
  autoComplete?: string;
};

export function FoundationPasswordField({
  id,
  label,
  value,
  onChange,
  context,
  required,
  autoComplete = "new-password",
}: FoundationPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const analysis = useMemo(() => validateStrongPassword(value, context), [value, context]);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">Força da senha</span>
            <span className={cn("font-semibold", LEVEL_TEXT[analysis.level])}>{analysis.levelLabel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                LEVEL_COLORS[analysis.level],
                LEVEL_WIDTH[analysis.level]
              )}
            />
          </div>
          <ul className="mt-2 space-y-1" aria-label="Requisitos de senha">
            {analysis.requirements.map((req) => (
              <li
                key={req.id}
                className={cn(
                  "flex items-start gap-2 text-xs",
                  req.mandatory ? (req.met ? "text-green-700" : "text-gray-600") : "text-gray-500"
                )}
              >
                {req.met ? (
                  <Check className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                ) : (
                  <X
                    className={cn("mt-0.5 h-3 w-3 shrink-0", req.mandatory ? "opacity-70" : "opacity-40")}
                    aria-hidden
                  />
                )}
                <span>{req.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type FoundationConfirmPasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  password: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function FoundationConfirmPasswordField({
  id,
  label,
  value,
  password,
  onChange,
  required,
}: FoundationConfirmPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const mismatch = value.length > 0 && value !== password;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete="new-password"
          className={cn("pr-10", mismatch && "border-red-500")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
          aria-label={visible ? "Ocultar confirmação" : "Mostrar confirmação"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {mismatch && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {PASSWORD_MISMATCH_MESSAGE}
        </p>
      )}
    </div>
  );
}
