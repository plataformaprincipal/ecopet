"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";

export function FoundationForgotPasswordForm() {
  const { t, tApi } = useAuthMessages();
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? t("common.error");
        setError(tApi(msg));
        return;
      }

      setSent(true);
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.forgotPassword.title")}</CardTitle>
        <CardDescription>{t("auth.forgotPassword.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div role="status" aria-live="polite">
            <p className="text-sm text-green-700">{t("auth.forgotPassword.success")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.forgotPassword.checkInbox")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-identifier" className="text-sm font-medium">
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
                className="mt-1"
                aria-label={t("auth.forgotPassword.identifier")}
                aria-invalid={!!error}
                aria-describedby={error ? "forgot-error" : undefined}
              />
            </div>
            {error && (
              <p id="forgot-error" className="text-sm text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
