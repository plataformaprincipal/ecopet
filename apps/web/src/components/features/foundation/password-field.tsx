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
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";

const LEVEL_COLORS: Record<string, string> = {
  very_weak: "bg-red-500",
  weak: "bg-orange-500",
  medium: "bg-amber-400",
  strong: "bg-green-600",
  excellent: "bg-emerald-700",
};

const LEVEL_WIDTH: Record<string, string> = {
  very_weak: "w-1/5",
  weak: "w-2/5",
  medium: "w-3/5",
  strong: "w-4/5",
  excellent: "w-full",
};

const LEVEL_TEXT: Record<string, string> = {
  very_weak: "text-red-600",
  weak: "text-orange-600",
  medium: "text-amber-600",
  strong: "text-green-700",
  excellent: "text-emerald-800",
};

const TIP_KEYS = [
  "auth.password.tips.avoidName",
  "auth.password.tips.avoidFamily",
  "auth.password.tips.avoidDates",
  "auth.password.tips.avoidCommon",
  "auth.password.tips.avoidSocial",
  "auth.password.tips.combine",
  "auth.password.tips.length",
] as const;

type FoundationPasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  context?: PasswordValidationContext;
  required?: boolean;
  autoComplete?: string;
  showRecommendations?: boolean;
};

export function FoundationPasswordField({
  id,
  label,
  value,
  onChange,
  context,
  required,
  autoComplete = "new-password",
  showRecommendations = false,
}: FoundationPasswordFieldProps) {
  const { t, tpwLevel, tpwReq } = useAuthMessages();
  const [visible, setVisible] = useState(false);
  const analysis = useMemo(() => validateStrongPassword(value, context), [value, context]);
  const levelLabel = tpwLevel(analysis.level);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
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
          aria-label={label}
          aria-describedby={`${id}-strength ${showRecommendations ? `${id}-recommendations` : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
          aria-label={visible ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          <span className="sr-only">
            {visible ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
          </span>
        </button>
      </div>

      {value.length > 0 && (
        <div id={`${id}-strength`} className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">{t("auth.password.strengthLabel")}</span>
            <span className={cn("font-semibold", LEVEL_TEXT[analysis.level])}>{levelLabel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                LEVEL_COLORS[analysis.level],
                LEVEL_WIDTH[analysis.level]
              )}
              role="meter"
              aria-valuenow={
                analysis.level === "very_weak"
                  ? 1
                  : analysis.level === "weak"
                    ? 2
                    : analysis.level === "medium"
                      ? 3
                      : analysis.level === "strong"
                        ? 4
                        : 5
              }
              aria-valuemin={1}
              aria-valuemax={5}
              aria-label={t("auth.password.strengthLabel")}
            />
          </div>
          <ul className="mt-2 space-y-1" aria-label={t("auth.password.requirementsLabel")}>
            {analysis.requirements.map((req) => (
              <li
                key={req.id}
                className={cn(
                  "flex items-start gap-2 text-xs",
                  req.met ? "text-green-700" : "text-gray-600"
                )}
              >
                {req.met ? (
                  <Check className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                ) : (
                  <X className="mt-0.5 h-3 w-3 shrink-0 opacity-70" aria-hidden />
                )}
                <span>
                  {req.met ? "✓" : "✗"} {tpwReq(req.id)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRecommendations && (
        <aside
          id={`${id}-recommendations`}
          className="mt-4 rounded-lg border border-green-100 bg-green-50/50 p-4 text-xs text-gray-700"
          aria-label={t("auth.password.recommendationsAria")}
        >
          <h3 className="mb-2 font-semibold text-green-900">
            {t("auth.password.recommendationsTitle")}
          </h3>
          <ul className="space-y-1">
            {TIP_KEYS.map((key) => (
              <li key={key} className="flex gap-1.5">
                <span aria-hidden>✓</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </aside>
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
  const { t } = useAuthMessages();
  const [visible, setVisible] = useState(false);
  const matches = value.length > 0 && value === password;
  const mismatch = value.length > 0 && value !== password;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete="new-password"
          className={cn("pr-10", mismatch && "border-red-500", matches && "border-green-500")}
          aria-label={label}
          aria-describedby={`${id}-match-status`}
          aria-invalid={mismatch}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
          aria-label={
            visible ? t("auth.password.hideConfirm") : t("auth.password.showConfirm")
          }
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {value.length > 0 && (
        <p
          id={`${id}-match-status`}
          className={cn(
            "mt-1 flex items-center gap-1 text-sm",
            matches && "text-green-700",
            mismatch && "text-red-600"
          )}
          role="status"
          aria-live="polite"
        >
          {matches ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden /> ✓ {t("auth.password.match")}
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" aria-hidden /> ✗ {t("auth.password.mismatch")}
            </>
          )}
        </p>
      )}
      {mismatch && (
        <p className="sr-only" role="alert">
          {t("auth.validation.passwordMismatch")}
        </p>
      )}
    </div>
  );
}

export { PASSWORD_MISMATCH_MESSAGE };
