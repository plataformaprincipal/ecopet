"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button";
import { useTranslation } from "@/providers/i18n-provider";

type AccessMethods = {
  passwordConfigured: boolean;
  googleConnected: boolean;
  canUnlinkGoogle: boolean;
};

export function AccessMethodsPanel() {
  const { t } = useTranslation();
  const [methods, setMethods] = useState<AccessMethods | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/methods", { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      setError(t("auth.google.errors.GENERIC"));
      return;
    }
    setMethods(json.data.methods);
    setError("");
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unlink() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/methods", { method: "DELETE", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        const code = json.error?.code as string | undefined;
        setError(
          code === "LAST_AUTH_METHOD"
            ? t("auth.google.errors.LAST_AUTH_METHOD")
            : t("auth.google.unlinkFailed")
        );
        return;
      }
      setMethods(json.data.methods);
    } finally {
      setBusy(false);
    }
  }

  if (!methods) {
    return <p className="text-sm text-ecopet-gray">{t("auth.google.processing")}</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ecopet-dark dark:text-white">
        {t("auth.google.methodsTitle")}
      </h3>
      <p className="text-sm text-ecopet-gray">
        {methods.passwordConfigured
          ? t("auth.google.passwordConfigured")
          : t("auth.google.passwordMissing")}
      </p>
      <p className="text-sm text-ecopet-gray">
        {methods.googleConnected
          ? t("auth.google.googleConnected")
          : t("auth.google.googleDisconnected")}
      </p>
      {!methods.googleConnected ? (
        <GoogleSignInButton intent="link" returnTo="/configuracoes" />
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy || !methods.canUnlinkGoogle}
          onClick={() => void unlink()}
        >
          {t("auth.google.disconnect")}
        </Button>
      )}
      {error ? (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
