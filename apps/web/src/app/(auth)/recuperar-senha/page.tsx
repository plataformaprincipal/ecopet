"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-errors";
import { useTranslation } from "@/providers/i18n-provider";
import { FORGOT_PASSWORD_GENERIC_MESSAGE } from "@/lib/constants/auth-messages";

function parseApiError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.message) return err.message;
  }
  return "";
}

export default function RecuperarSenhaPage() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api<{ message?: string; resetToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      setSent(true);
      if (res.resetToken) setDevToken(res.resetToken);
    } catch (err) {
      const message = parseApiError(err);
      if (message) {
        setError(message);
      } else if (err instanceof ApiRequestError && (err.status ?? 0) >= 500) {
        setError(t("common.error"));
      } else {
        setError(t("common.error"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader>
        <CardTitle>{t("auth.forgotPassword.title")}</CardTitle>
        <CardDescription>{t("auth.forgotPassword.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-ecopet-green" role="status" aria-live="polite">
              {FORGOT_PASSWORD_GENERIC_MESSAGE}
            </p>
            <p className="text-ecopet-gray">{t("auth.forgotPassword.checkInbox")}</p>
            {devToken && (
              <p className="rounded-lg bg-ecopet-yellow/10 p-3 text-xs break-all">
                Dev: /redefinir-senha?token={devToken}
              </p>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
            aria-describedby={error ? "recovery-error" : undefined}
          >
            <div>
              <label htmlFor="recovery-identifier" className="text-sm font-medium">
                {t("auth.forgotPassword.identifier")}
              </label>
              <Input
                id="recovery-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("auth.forgotPassword.identifierPlaceholder")}
                required
                autoComplete="username"
                inputMode="email"
                className="mt-1"
                aria-label={t("auth.forgotPassword.identifier")}
                aria-invalid={!!error}
                aria-describedby={error ? "recovery-error" : undefined}
              />
            </div>
            {error && (
              <p
                id="recovery-error"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-ecopet-green hover:underline">
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
