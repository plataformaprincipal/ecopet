"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { notifySessionChanged } from "@/lib/auth/session-events";
import { confirmSessionCookie } from "@/lib/auth/confirm-session";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";

function parseApiError(data: {
  error?: string | { message?: string; code?: string };
}): { message: string; code?: string } {
  if (typeof data.error === "string") return { message: data.error };
  if (data.error && typeof data.error === "object" && data.error.message) {
    return { message: data.error.message, code: data.error.code };
  }
  return { message: "" };
}

export function FoundationLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tApi } = useAuthMessages();
  const callbackUrl = searchParams.get("callbackUrl");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        const parsed = parseApiError(data);
        setError(
          tApi(parsed.message || t("auth.login.genericError"), parsed.code)
        );
        return;
      }
      const redirectTo =
        data.data?.redirectTo ??
        (data.user?.role ? dashboardPathForRole(data.user.role) : null) ??
        (callbackUrl?.startsWith("/") ? callbackUrl : "/dashboard");
      const sessionReady = await confirmSessionCookie();
      if (!sessionReady) {
        setError(t("auth.login.sessionError"));
        return;
      }
      router.push(redirectTo);
      notifySessionChanged();
      router.refresh();
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("auth.login.pageTitle")}</CardTitle>
        <CardDescription>{t("auth.login.pageDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          aria-describedby={error ? "login-error" : undefined}
        >
          <div>
            <label htmlFor="login-identifier" className="text-sm font-medium">
              {t("auth.login.identifier")}
            </label>
            <Input
              id="login-identifier"
              type="text"
              placeholder={t("auth.login.identifierPlaceholder")}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="mt-1"
              autoComplete="username"
              aria-label={t("auth.login.identifier")}
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-sm font-medium">
              {t("auth.login.password")}
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              autoComplete="current-password"
              aria-label={t("auth.login.password")}
            />
          </div>
          <p className="text-right text-sm">
            <Link href="/esqueci-senha" className="text-green-700 hover:underline">
              {t("auth.login.forgotLink")}
            </Link>
          </p>
          {error && (
            <p id="login-error" className="text-sm text-red-600" role="alert" aria-live="polite">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.login.entering") : t("auth.login.submit")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {t("auth.login.noAccount")}{" "}
          <Link href="/cadastro" className="font-semibold text-green-700 hover:underline">
            {t("auth.login.signUpLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
