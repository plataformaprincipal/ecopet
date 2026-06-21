"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import {
  validateStrongPassword,
  type PasswordValidationContext,
} from "@/lib/password/validate-strong-password";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tpwError, tv, tApi } = useAuthMessages();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [passwordContext, setPasswordContext] = useState<PasswordValidationContext>({});

  const tokenMessages: Record<string, string> = {
    invalid: t("auth.resetPassword.tokenInvalid"),
    expired: t("auth.resetPassword.tokenExpired"),
    used: t("auth.resetPassword.tokenUsed"),
  };

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError(tokenMessages.invalid);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (data.valid) {
          setTokenValid(true);
          if (data.passwordContext) {
            setPasswordContext(data.passwordContext);
          }
        } else {
          setTokenError(tokenMessages[data.reason as string] ?? tokenMessages.invalid);
        }
      })
      .catch(() => setTokenError(t("common.error")))
      .finally(() => setValidating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.validation.passwordMismatch"));
      return;
    }

    const pwdCheck = validateStrongPassword(password, passwordContext);
    if (!pwdCheck.valid) {
      setError(pwdCheck.errorId ? tpwError(pwdCheck.errorId) : t("auth.validation.passwordWeak"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(tApi(typeof data.error === "string" ? data.error : data.error?.message ?? ""));
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-8 text-center text-sm text-gray-600">
          {t("auth.resetPassword.validating")}
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-8 text-center">
          <p className="font-semibold text-green-700">{t("auth.resetPassword.success")}</p>
          <p className="mt-2 text-sm text-gray-600">{t("auth.resetPassword.redirecting")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-sm text-red-600" role="alert">
            {tokenError}
          </p>
          <Link href="/esqueci-senha" className="inline-block text-sm font-semibold text-green-700 hover:underline">
            {t("auth.resetPassword.requestNewLink")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.resetPassword.title")}</CardTitle>
        <CardDescription>{t("auth.resetPassword.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FoundationPasswordField
            id="new-password"
            label={t("auth.resetPassword.newPassword")}
            value={password}
            onChange={setPassword}
            context={passwordContext}
            required
          />
          <FoundationConfirmPasswordField
            id="confirm-password"
            label={t("auth.resetPassword.confirmPassword")}
            value={confirmPassword}
            password={password}
            onChange={setConfirmPassword}
            required
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {tv(error)}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            {t("auth.resetPassword.backToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function FoundationResetPasswordForm() {
  const { t } = useAuthMessages();

  return (
    <Suspense fallback={<div className="text-center text-sm text-gray-600">{t("auth.login.loading")}</div>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
