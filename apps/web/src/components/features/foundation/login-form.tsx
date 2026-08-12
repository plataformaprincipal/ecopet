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
import { analyticsService } from "@/lib/analytics/service";
import { AuthEvents } from "@/lib/analytics/events";

function parseApiError(data: {
  error?: string | { message?: string; code?: string };
}): { message: string; code?: string } {
  if (typeof data.error === "string") return { message: data.error };
  if (data.error && typeof data.error === "object" && data.error.message) {
    return { message: data.error.message, code: data.error.code };
  }
  return { message: "" };
}

type FoundationLoginFormProps = {
  variant?: "default" | "premium";
};

export function FoundationLoginForm({ variant = "default" }: FoundationLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tApi } = useAuthMessages();
  const callbackUrl = searchParams.get("callbackUrl");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const raw = await res.text();
      let data: {
        success?: boolean;
        data?: { redirectTo?: string; user?: { role?: string } };
        error?: string | { message?: string; code?: string };
      };
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        setError(t("auth.login.connectionError"));
        return;
      }
      if (!res.ok || data.success === false) {
        analyticsService.track(AuthEvents.LOGIN_ERROR, {
          label: "credentials",
          params: { method: "credentials" },
        });
        const parsed = parseApiError(data);
        const credentialFail =
          parsed.code === "WRONG_PASSWORD" ||
          parsed.code === "USER_NOT_FOUND" ||
          parsed.code === "INVALID_CREDENTIALS" ||
          parsed.code === "TURNSTILE_REQUIRED" ||
          parsed.code === "TURNSTILE_FAILED";
        setError(
          credentialFail
            ? t("auth.login.invalidCredentials")
            : tApi(parsed.message || t("auth.login.genericError"), parsed.code)
        );
        return;
      }
      const safeCallback =
        callbackUrl &&
        callbackUrl.startsWith("/") &&
        !callbackUrl.startsWith("//") &&
        !callbackUrl.startsWith("/\\")
          ? callbackUrl
          : "/dashboard";
      const redirectTo =
        data.data?.redirectTo ??
        (data.data?.user?.role ? dashboardPathForRole(data.data.user.role) : null) ??
        safeCallback;
      const sessionReady = await confirmSessionCookie();
      if (!sessionReady) {
        setError(t("auth.login.sessionError"));
        return;
      }
      const user = data.data?.user as { id?: string; role?: string } | undefined;
      const role = user?.role;
      if (user?.id) {
        analyticsService.setUser({ userId: user.id, userRole: role ?? null });
      }
      analyticsService.track(AuthEvents.LOGIN, {
        label: "credentials",
        params: { method: "credentials", user_role: role },
      });
      router.push(redirectTo);
      notifySessionChanged();
      router.refresh();
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  const formContent = (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        aria-describedby={error ? "login-error" : undefined}
      >
        <div>
          <label htmlFor="login-identifier" className="text-sm font-medium text-ecopet-dark dark:text-white">
            {t("auth.login.identifier")}
          </label>
          <Input
            id="login-identifier"
            type="text"
            placeholder={t("auth.login.identifierPlaceholder")}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError("");
            }}
            required
            className="mt-1 rounded-xl"
            autoComplete="username"
            aria-label={t("auth.login.identifier")}
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="text-sm font-medium text-ecopet-dark dark:text-white">
              {t("auth.login.password")}
            </label>
            <button
              type="button"
              className="text-xs font-medium text-ecopet-green hover:underline dark:text-emerald-400"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
            >
              {showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
            </button>
          </div>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.login.passwordPlaceholder")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            required
            className="mt-1 rounded-xl"
            autoComplete="current-password"
            aria-label={t("auth.login.password")}
          />
        </div>
        <p className="text-right text-sm">
          <Link
            href="/recuperar-senha"
            className="inline-block rounded-sm font-medium text-ecopet-green underline-offset-2 transition-colors hover:text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green/40 focus-visible:ring-offset-2 dark:text-emerald-400 dark:hover:text-emerald-300"
            aria-label={t("auth.login.forgotLinkAria")}
          >
            {t("auth.login.forgot")}
          </Link>
        </p>

        {error && (
          <p id="login-error" className="text-sm text-red-600 dark:text-red-400" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full rounded-2xl" size="lg" disabled={loading}>
          {loading ? t("auth.login.entering") : t("auth.login.submit")}
        </Button>
      </form>
      {variant === "default" && (
        <p className="mt-4 text-center text-sm text-ecopet-gray dark:text-white/65">
          {t("auth.login.noAccount")}{" "}
          <Link href="/cadastro" className="font-semibold text-ecopet-green hover:underline dark:text-emerald-400">
            {t("auth.login.signUpLink")}
          </Link>
        </p>
      )}
    </>
  );

  if (variant === "premium") {
    return <div className="w-full">{formContent}</div>;
  }

  return (
    <Card className="mx-auto w-full max-w-md border-ecopet-gray/10 bg-white shadow-sm dark:border-white/10 dark:bg-ecopet-dark-card">
      <CardHeader>
        <CardTitle className="text-ecopet-dark dark:text-white">{t("auth.login.pageTitle")}</CardTitle>
        <CardDescription className="dark:text-white/65">{t("auth.login.pageDescription")}</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
