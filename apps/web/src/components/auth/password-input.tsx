"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Check, X, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { analyzePassword } from "@/lib/password/strength";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  confirmValue?: string;
  showStrength?: boolean;
  showRequirements?: boolean;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  confirmError?: string;
  onConfirmChange?: (value: string) => void;
  confirmId?: string;
  label?: string;
  confirmLabel?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  confirmValue,
  showStrength = true,
  showRequirements = true,
  placeholder = "Sua senha segura",
  autoComplete = "new-password",
  error,
  confirmError,
  onConfirmChange,
  confirmId = "confirmPassword",
  label = "Senha",
  confirmLabel = "Confirmar senha",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const analysis = useMemo(() => analyzePassword(value), [value]);
  const passwordsMatch = confirmValue !== undefined && confirmValue.length > 0 && value === confirmValue;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ecopet-dark dark:text-white">
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <Input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ecopet-gray hover:text-ecopet-dark dark:hover:text-white"
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-500" role="alert">{error}</p>}

        {showStrength && value.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ecopet-gray">Força da senha</span>
              <span className={cn(
                "font-semibold",
                analysis.strength === "weak" && "text-red-500",
                analysis.strength === "medium" && "text-amber-600",
                (analysis.strength === "strong" || analysis.strength === "excellent") && "text-ecopet-green"
              )}>
                {analysis.label}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ecopet-gray/15">
              <div
                className={cn("h-full rounded-full transition-all duration-500", analysis.color, analysis.barWidth)}
              />
            </div>
          </div>
        )}

        {showRequirements && (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2" aria-label="Requisitos de senha">
            {analysis.requirements.map((req) => (
              <li
                key={req.id}
                className={cn(
                  "flex items-center gap-2 text-xs transition-colors",
                  req.met ? "text-ecopet-green" : "text-ecopet-gray"
                )}
              >
                {req.met ? (
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        )}

        {/* Preparado para alerta de senha comprometida */}
        <div className="mt-2 hidden items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200" data-compromised-alert>
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Esta senha apareceu em vazamentos de dados. Escolha uma senha diferente.</span>
        </div>
      </div>

      {onConfirmChange && (
        <div>
          <label htmlFor={confirmId} className="text-sm font-semibold text-ecopet-dark dark:text-white">
            {confirmLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <Input
              id={confirmId}
              type={confirmVisible ? "text" : "password"}
              value={confirmValue ?? ""}
              onChange={(e) => onConfirmChange(e.target.value)}
              autoComplete="new-password"
              className={cn("pr-11", passwordsMatch && "border-ecopet-green focus:border-ecopet-green")}
            />
            <button
              type="button"
              onClick={() => setConfirmVisible(!confirmVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ecopet-gray"
              aria-label={confirmVisible ? "Ocultar confirmação" : "Mostrar confirmação"}
            >
              {confirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmValue && confirmValue.length > 0 && (
            <p className={cn("mt-1 flex items-center gap-1 text-xs", passwordsMatch ? "text-ecopet-green" : "text-red-500")}>
              {passwordsMatch ? <><Check className="h-3 w-3" /> Senhas coincidem</> : "Senhas não coincidem"}
            </p>
          )}
          {confirmError && <p className="mt-1 text-xs text-red-500" role="alert">{confirmError}</p>}
        </div>
      )}
    </div>
  );
}
