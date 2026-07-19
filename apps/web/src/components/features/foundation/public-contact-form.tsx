"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TurnstileField } from "@/components/security/turnstile-field";
import { useTurnstile } from "@/hooks/use-turnstile";
import { TURNSTILE_ACTIONS } from "@/lib/turnstile/actions";
import { getTurnstilePublicConfig } from "@/lib/turnstile/config";
import { useTranslation } from "@/providers/i18n-provider";

export function PublicContactForm() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const turnstileEnabled = useMemo(() => getTurnstilePublicConfig().enabled, []);
  const turnstile = useTurnstile({
    action: TURNSTILE_ACTIONS.CONTACT_FORM,
    required: turnstileEnabled,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (turnstileEnabled && !turnstile.isVerified) {
      setError(t("turnstile.required"));
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          turnstileToken: turnstile.consumeToken(),
          turnstileAction: TURNSTILE_ACTIONS.CONTACT_FORM,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? t("common.error");
        setError(msg);
        turnstile.reset();
        return;
      }
      setSuccess(data.data?.message ?? "OK");
      setSubject("");
      setMessage("");
      turnstile.reset();
    } catch {
      setError(t("common.error"));
      turnstile.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-xl ring-1 ring-ecopet-gray/10 dark:ring-white/10">
      <CardHeader>
        <CardTitle className="font-display text-2xl">{t("common.contact")}</CardTitle>
        <CardDescription>{t("turnstile.required")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
              Nome
            </label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
              E-mail
            </label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium">
              Assunto
            </label>
            <Input
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-1 block text-sm font-medium">
              Mensagem
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full rounded-xl border border-ecopet-gray/20 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ecopet-green/30 dark:border-white/10 dark:bg-ecopet-dark-card dark:text-white"
            />
          </div>

          {turnstileEnabled ? (
            <TurnstileField
              action={TURNSTILE_ACTIONS.CONTACT_FORM}
              state={turnstile.state}
              resetKey={turnstile.resetKey}
              onVerify={turnstile.onVerify}
              onExpire={turnstile.onExpire}
              onError={turnstile.onError}
              onLoad={turnstile.onLoad}
            />
          ) : null}

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-ecopet-green" role="status">
              {success}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (turnstileEnabled && !turnstile.isVerified)}
          >
            {loading ? t("common.loading") : t("common.contact")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
