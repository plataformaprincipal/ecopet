"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  acceptAllConsent,
  acceptNecessaryOnly,
  hasConsentChoice,
  updateConsent,
  type ConsentChoiceSource,
} from "@/lib/analytics/consent";
import type { ConsentSettings } from "@/lib/analytics/types";

type Props = {
  /** Paths onde o banner não aparece (prefixos). */
  excludePathPrefixes?: string[];
};

const DEFAULT_EXCLUDE = ["/admin", "/api", "/dashboard"];

/**
 * Banner Consent Mode v2 — LGPD.
 * Reutilizável; ponte CMP via applyExternalCmpConsent.
 */
export function ConsentBanner({ excludePathPrefixes = DEFAULT_EXCLUDE }: Props) {
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [draft, setDraft] = useState<ConsentSettings>({
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    if (excludePathPrefixes.some((p) => path === p || path.startsWith(`${p}/`))) {
      return;
    }
    if (!hasConsentChoice()) setVisible(true);
  }, [excludePathPrefixes]);

  const close = useCallback(() => setVisible(false), []);

  const onAcceptAll = () => {
    acceptAllConsent();
    close();
  };

  const onNecessary = () => {
    acceptNecessaryOnly();
    close();
  };

  const onSaveCustom = () => {
    updateConsent(draft, "banner" as ConsentChoiceSource);
    close();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div>
          <h2 id="consent-banner-title" className="text-base font-semibold tracking-tight">
            Privacidade e cookies
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usamos cookies essenciais para o funcionamento do EcoPet. Analytics e publicidade só
            com o seu consentimento (LGPD / Consent Mode v2).{" "}
            <Link href="/legal/cookies" className="underline underline-offset-2">
              Política de cookies
            </Link>
          </p>
        </div>

        {customize ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {(
              [
                ["analytics_storage", "Analytics"],
                ["ad_storage", "Anúncios (storage)"],
                ["ad_user_data", "Dados de anúncio"],
                ["ad_personalization", "Personalização"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft[key] === "granted"}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      [key]: e.target.checked ? "granted" : "denied",
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onAcceptAll}>
            Aceitar todos
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onNecessary}>
            Apenas essenciais
          </Button>
          {customize ? (
            <Button type="button" size="sm" variant="secondary" onClick={onSaveCustom}>
              Salvar preferências
            </Button>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={() => setCustomize(true)}>
              Personalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
