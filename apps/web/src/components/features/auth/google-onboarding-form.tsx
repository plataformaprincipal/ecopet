"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";

const ROLES = ["CLIENT", "PARTNER", "ONG"] as const;

export function GoogleOnboardingForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("CLIENT");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/google/complete", { credentials: "include" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setExpired(true);
          return;
        }
        setEmail(json.data?.email ?? "");
        setName(json.data?.name ?? "");
      })
      .catch(() => setExpired(true));
  }, []);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, termsAccepted: terms, privacyAccepted: privacy }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error?.code ?? "GENERIC");
      }
      const { confirmSessionCookie } = await import("@/lib/auth/confirm-session");
      const { notifySessionChanged } = await import("@/lib/auth/session-events");
      await confirmSessionCookie();
      notifySessionChanged();
      router.replace(json.data.redirectTo || "/");
      router.refresh();
    } catch (e) {
      const code = e instanceof Error ? e.message : "GENERIC";
      setError(t(`auth.google.errors.${code}` as "auth.google.errors.GENERIC"));
      setBusy(false);
    }
  }

  if (expired) {
    return (
      <p className="text-sm text-ecopet-gray" role="alert">
        {t("auth.google.errors.EXPIRED")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-ecopet-gray dark:text-white/70">
        {name} · {email}
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("auth.google.chooseRole")}</legend>
        {ROLES.map((r) => (
          <label key={r} className="flex min-h-[44px] items-center gap-2 text-sm">
            <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
            {t(`auth.google.roles.${r}`)}
          </label>
        ))}
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>{t("auth.google.acceptTerms")}</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
        <span>{t("auth.google.acceptPrivacy")}</span>
      </label>
      {error ? (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      <Button type="button" className="w-full min-h-[48px]" disabled={busy || !terms || !privacy} onClick={() => void submit()}>
        {busy ? t("auth.google.processing") : t("auth.google.finish")}
      </Button>
    </div>
  );
}
