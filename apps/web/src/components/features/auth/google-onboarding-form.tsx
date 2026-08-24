"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import { CLIENT_LEGAL } from "@/lib/legal/legal-links";

export function GoogleOnboardingForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [picture, setPicture] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
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
        setPicture(typeof json.data?.picture === "string" ? json.data.picture : null);
      })
      .catch(() => setExpired(true));
  }, []);

  async function submit() {
    if (busy || !accepted) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAccepted: accepted,
          privacyAccepted: accepted,
        }),
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

  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <div className="space-y-6">
      <p className="text-center text-sm font-medium text-ecopet-green">{t("auth.google.tutorBadge")}</p>
      <div className="flex flex-col items-center text-center">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picture}
            alt=""
            className="h-16 w-16 rounded-full object-cover ring-2 ring-ecopet-green/20"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ecopet-green/10 text-lg font-semibold text-ecopet-green">
            {(firstName[0] ?? "E").toUpperCase()}
          </div>
        )}
        <p className="mt-3 font-display text-xl font-semibold text-ecopet-dark dark:text-white">
          {t("auth.google.helloName", { name: firstName })}
        </p>
        <p className="mt-1 text-sm text-ecopet-gray dark:text-white/70">{email}</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ecopet-gray dark:text-white/70">
          {t("auth.google.creatingTutor")}
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ecopet-dark dark:text-white">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-ecopet-green focus:ring-ecopet-green"
        />
        <span>
          {t("auth.google.acceptLegalPrefix")}{" "}
          <Link
            href={CLIENT_LEGAL.terms.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ecopet-green underline-offset-2 hover:underline"
          >
            {t("auth.google.termsLink")}
          </Link>{" "}
          {t("auth.google.acceptLegalJoin")}{" "}
          <Link
            href={CLIENT_LEGAL.privacy.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ecopet-green underline-offset-2 hover:underline"
          >
            {t("auth.google.privacyLink")}
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full min-h-[48px]"
        disabled={busy || !accepted}
        onClick={() => void submit()}
      >
        {busy ? t("auth.google.processing") : t("auth.google.finish")}
      </Button>

      <p className="text-center text-xs text-ecopet-gray dark:text-white/50">
        {t("auth.google.existingAccountHint")}
      </p>
    </div>
  );
}
