"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/password-input";
import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-errors";
import { useTranslation } from "@/providers/i18n-provider";

function RedefinirSenhaForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token] = useState(tokenFromUrl);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) {
      setValidating(false);
      setTokenError(t("auth.resetPassword.tokenInvalid"));
      return;
    }
    api<{ valid: boolean; reason?: string }>(
      `/api/auth/reset-password/validate?token=${encodeURIComponent(tokenFromUrl)}`
    )
      .then((res) => {
        if (res.valid) {
          setTokenValid(true);
        } else {
          const key =
            res.reason === "expired"
              ? "auth.resetPassword.tokenExpired"
              : res.reason === "used"
                ? "auth.resetPassword.tokenUsed"
                : "auth.resetPassword.tokenInvalid";
          setTokenError(t(key));
        }
      })
      .catch(() => setTokenError(t("common.error")))
      .finally(() => setValidating(false));
  }, [tokenFromUrl, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (novaSenha.length < 8) {
      setError(t("auth.resetPassword.passwordMin"));
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, novaSenha, confirmarNovaSenha }),
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center text-sm text-ecopet-gray">{t("auth.resetPassword.validating")}</CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-ecopet-green" />
          <p className="mt-3 font-semibold text-ecopet-green">{t("auth.resetPassword.success")}</p>
          <p className="mt-2 text-sm text-ecopet-gray">{t("auth.resetPassword.redirecting")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="text-sm text-red-600" role="alert">
            {tokenError}
          </p>
          <Link href="/recuperar-senha" className="inline-block text-sm text-ecopet-green hover:underline">
            {t("auth.resetPassword.requestNewLink")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader>
        <CardTitle>{t("auth.resetPassword.title")}</CardTitle>
        <CardDescription>{t("auth.resetPassword.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="text-sm font-medium">
              {t("auth.resetPassword.newPassword")}
            </label>
            <PasswordInput
              id="new-password"
              value={novaSenha}
              onChange={setNovaSenha}
              autoComplete="new-password"
              showStrength={false}
              showRequirements={false}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="text-sm font-medium">
              {t("auth.resetPassword.confirmPassword")}
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirmarNovaSenha}
              onChange={setConfirmarNovaSenha}
              autoComplete="new-password"
              showStrength={false}
              showRequirements={false}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-ecopet-green hover:underline">
            {t("auth.resetPassword.backToLogin")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="text-sm text-ecopet-gray">{t("common.loading")}</div>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
