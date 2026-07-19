"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnstileField } from "@/components/security/turnstile-field";
import { useTurnstile } from "@/hooks/use-turnstile";
import { TURNSTILE_ACTIONS } from "@/lib/turnstile/actions";
import { getTurnstilePublicConfig } from "@/lib/turnstile/config";
import {
  FoundationPasswordField,
  FoundationConfirmPasswordField,
} from "@/components/features/foundation/password-field";
import { validateStrongPassword } from "@/lib/password/validate-strong-password";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";
import { cn } from "@/lib/utils";

type Step = "identifier" | "code" | "password" | "done";

const RESEND_SECONDS = 60;

function OtpInput({
  value,
  onChange,
  disabled,
  id,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  id: string;
  label: string;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const setDigit = (index: number, char: string) => {
    const clean = char.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("").slice(0, 6);
    arr[index] = clean || " ";
    const next = arr.join("").replace(/ /g, "").slice(0, 6);
    onChange(next);
    if (clean && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div>
      <p id={`${id}-label`} className="mb-2 text-sm font-medium text-ecopet-dark dark:text-white">
        {label}
      </p>
      <div
        className="flex justify-between gap-2"
        role="group"
        aria-labelledby={`${id}-label`}
        onPaste={onPaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={d.trim()}
            aria-label={`${label} — dígito ${i + 1} de 6`}
            className={cn(
              "h-12 w-full max-w-[3rem] rounded-xl border border-ecopet-gray/20 bg-white text-center text-lg font-semibold",
              "shadow-sm transition-all focus:border-ecopet-green focus:outline-none focus:ring-2 focus:ring-ecopet-green/30",
              "dark:border-white/10 dark:bg-ecopet-dark-card dark:text-white"
            )}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
      </div>
    </div>
  );
}

export function FoundationForgotPasswordForm() {
  const router = useRouter();
  const { t, tApi, tpwError, tv } = useAuthMessages();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const turnstileEnabled = useMemo(() => getTurnstilePublicConfig().enabled, []);
  const turnstile = useTurnstile({
    action: TURNSTILE_ACTIONS.PASSWORD_RECOVERY,
    required: turnstileEnabled,
  });

  useEffect(() => {
    if (resendIn <= 0) return;
    const tmr = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(tmr);
  }, [resendIn]);

  const startResendCooldown = useCallback(() => setResendIn(RESEND_SECONDS), []);

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (turnstileEnabled && !turnstile.isVerified) {
      setError(t("turnstile.required"));
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          turnstileToken: turnstile.consumeToken(),
          turnstileAction: TURNSTILE_ACTIONS.PASSWORD_RECOVERY,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? t("common.error");
        setError(tApi(msg, data.error?.code));
        turnstile.reset();
        return;
      }

      const payload = data.data ?? data;
      setChannel(payload.channel === "phone" ? "phone" : "email");
      setInfo(t("auth.forgotPassword.success"));
      setStep("code");
      startResendCooldown();
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? t("common.error");
        setError(tApi(msg, data.error?.code));
        return;
      }

      const payload = data.data ?? data;
      const token = payload.resetToken as string | undefined;
      if (!token) {
        setError(t("common.error"));
        return;
      }

      setResetToken(token);
      setStep("password");
      setInfo("");
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.validation.passwordMismatch"));
      return;
    }

    const pwdCheck = validateStrongPassword(password, { email: identifier.includes("@") ? identifier : undefined });
    if (!pwdCheck.valid) {
      setError(pwdCheck.errorId ? tpwError(pwdCheck.errorId) : t("auth.validation.passwordWeak"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? t("common.error");
        setError(tApi(msg, data.error?.code));
        return;
      }

      setStep("done");
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  const stepTitle =
    step === "password"
      ? t("auth.resetPassword.title")
      : step === "code"
        ? t("auth.forgotPassword.codeStepTitle")
        : t("auth.forgotPassword.title");

  const stepDescription =
    step === "password"
      ? t("auth.resetPassword.description")
      : step === "code"
        ? t("auth.forgotPassword.codeDescription")
        : t("auth.forgotPassword.description");

  return (
    <Card className="mx-auto w-full max-w-md border-0 shadow-xl ring-1 ring-ecopet-gray/10 dark:ring-white/10">
      <CardHeader className="space-y-3 pb-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-ecopet-green dark:bg-emerald-950/40">
          {step === "password" ? (
            <ShieldCheck className="h-6 w-6" aria-hidden />
          ) : (
            <Mail className="h-6 w-6" aria-hidden />
          )}
        </div>
        <CardTitle className="font-display text-2xl">{stepTitle}</CardTitle>
        <CardDescription className="text-base">{stepDescription}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        {step === "done" ? (
          <div
            className="rounded-xl bg-emerald-50 px-4 py-6 text-center dark:bg-emerald-950/30"
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">
              {t("auth.resetPassword.success")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.resetPassword.redirecting")}</p>
          </div>
        ) : step === "password" ? (
          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            <FoundationPasswordField
              id="recovery-new-password"
              label={t("auth.resetPassword.newPassword")}
              value={password}
              onChange={setPassword}
              context={{ email: identifier.includes("@") ? identifier : undefined }}
              required
            />
            <FoundationConfirmPasswordField
              id="recovery-confirm-password"
              label={t("auth.resetPassword.confirmPassword")}
              value={confirmPassword}
              password={password}
              onChange={setConfirmPassword}
              required
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {tv(error)}
              </p>
            )}
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t("auth.resetPassword.submitting")}
                </>
              ) : (
                t("auth.resetPassword.submit")
              )}
            </Button>
          </form>
        ) : step === "code" ? (
          <form onSubmit={handleVerifyCode} className="space-y-5" noValidate>
            {info && (
              <p
                className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                role="status"
                aria-live="polite"
              >
                {info}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {channel === "phone"
                ? t("auth.forgotPassword.checkSms")
                : t("auth.forgotPassword.checkInbox")}
            </p>

            <OtpInput
              id="forgot-otp"
              label={t("auth.forgotPassword.codeLabel")}
              value={code}
              onChange={setCode}
              disabled={loading}
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}

            <Button type="submit" className="h-11 w-full text-base" disabled={loading || code.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t("auth.forgotPassword.verifying")}
                </>
              ) : (
                t("auth.forgotPassword.verifyCode")
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={loading || resendIn > 0}
              onClick={() => handleSendCode()}
            >
              {resendIn > 0
                ? t("auth.forgotPassword.resendWait", { seconds: String(resendIn) })
                : t("auth.forgotPassword.resendCode")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setStep("identifier");
                setCode("");
                setError("");
                setInfo("");
              }}
            >
              {t("auth.forgotPassword.changeIdentifier")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSendCode} className="space-y-5" noValidate>
            <div>
              <label htmlFor="forgot-identifier" className="mb-2 block text-sm font-medium">
                {t("auth.forgotPassword.identifier")}
              </label>
              <Input
                id="forgot-identifier"
                type="text"
                placeholder={t("auth.forgotPassword.identifierPlaceholder")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                inputMode="email"
                className="h-11 rounded-xl border-ecopet-gray/20 text-base shadow-sm focus-visible:ring-ecopet-green/30"
                aria-label={t("auth.forgotPassword.identifier")}
                aria-invalid={!!error}
                aria-describedby={error ? "forgot-error" : undefined}
              />
            </div>

            {turnstileEnabled ? (
              <TurnstileField
                action={TURNSTILE_ACTIONS.PASSWORD_RECOVERY}
                state={turnstile.state}
                resetKey={turnstile.resetKey}
                onVerify={turnstile.onVerify}
                onExpire={turnstile.onExpire}
                onError={turnstile.onError}
                onLoad={turnstile.onLoad}
              />
            ) : null}

            {error && (
              <p
                id="forgot-error"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={loading || (turnstileEnabled && !turnstile.isVerified)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t("auth.forgotPassword.submitting")}
                </>
              ) : (
                t("auth.forgotPassword.submit")
              )}
            </Button>
          </form>
        )}

        {step !== "done" && (
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-semibold text-ecopet-green underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green/40 rounded-sm"
            >
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
