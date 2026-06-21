"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ONG_LEGAL, ONG_LEGAL_ACCEPTANCE_MESSAGE } from "@/lib/legal/legal-links";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";
import type { TranslationKey } from "@/lib/i18n/types";

type OngLegalAcceptanceProps = {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  onAcceptTermsChange: (value: boolean) => void;
  onAcceptPrivacyChange: (value: boolean) => void;
  error?: string;
};

type LegalDocKey = "terms" | "privacy";

const LEGAL_CARDS: {
  key: LegalDocKey;
  icon: typeof FileText;
  accent: string;
  borderSelected: string;
  bgSelected: string;
  checkboxKey: TranslationKey;
  previewKey: TranslationKey;
}[] = [
  {
    key: "terms",
    icon: FileText,
    accent: "text-emerald-700",
    borderSelected: "border-emerald-600 ring-emerald-500/30",
    bgSelected: "bg-emerald-50/80 dark:bg-emerald-950/30",
    checkboxKey: "auth.terms.ong.terms",
    previewKey: "auth.terms.ong.termsPreview",
  },
  {
    key: "privacy",
    icon: Shield,
    accent: "text-teal-700",
    borderSelected: "border-teal-600 ring-teal-500/30",
    bgSelected: "bg-teal-50/80 dark:bg-teal-950/30",
    checkboxKey: "auth.terms.ong.privacy",
    previewKey: "auth.terms.ong.privacyPreview",
  },
];

export function OngLegalAcceptance({
  acceptTerms,
  acceptPrivacy,
  onAcceptTermsChange,
  onAcceptPrivacyChange,
  error,
}: OngLegalAcceptanceProps) {
  const { t, tv } = useAuthMessages();
  const [previewDoc, setPreviewDoc] = useState<LegalDocKey | null>(null);

  const checkedMap: Record<LegalDocKey, boolean> = {
    terms: acceptTerms,
    privacy: acceptPrivacy,
  };

  const onChangeMap: Record<LegalDocKey, (v: boolean) => void> = {
    terms: onAcceptTermsChange,
    privacy: onAcceptPrivacyChange,
  };

  const legalMap = {
    terms: ONG_LEGAL.terms,
    privacy: ONG_LEGAL.privacy,
  };

  return (
    <section
      aria-labelledby="ong-legal-acceptance-heading"
      className="space-y-4 rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-emerald-50/30 p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:from-ecopet-dark-card dark:to-emerald-950/20"
    >
      <header className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          aria-hidden
        >
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2
            id="ong-legal-acceptance-heading"
            className="font-display text-base font-semibold text-ecopet-dark dark:text-white"
          >
            {t("auth.terms.ong.legalHeading")}
          </h2>
          <p id="ong-legal-acceptance-hint" className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("auth.terms.ong.legalSubheading")}
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {LEGAL_CARDS.map(({ key, icon: Icon, accent, borderSelected, bgSelected, checkboxKey, previewKey }) => {
          const doc = legalMap[key];
          const checked = checkedMap[key];
          const inputId = `ong-accept-${key}`;

          return (
            <div
              key={key}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300",
                "hover:border-emerald-300 hover:shadow-md",
                checked
                  ? cn("shadow-sm ring-2 ring-offset-1", borderSelected, bgSelected)
                  : "border-gray-200 bg-white dark:border-white/10 dark:bg-ecopet-dark-card"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors dark:bg-white/10",
                    checked && accent
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onChangeMap[key](e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      aria-describedby="ong-legal-acceptance-hint ong-legal-acceptance-error"
                      aria-invalid={!!error && !checked}
                      required
                    />
                    <span className="text-sm font-medium leading-snug text-ecopet-dark dark:text-white">
                      {t(checkboxKey)}
                    </span>
                  </label>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                      {t("auth.terms.readFull")}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>

                    <Dialog open={previewDoc === key} onOpenChange={(open) => setPreviewDoc(open ? key : null)}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-700"
                        >
                          {t("auth.terms.preview")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{doc.title}</DialogTitle>
                          <DialogDescription>{t("auth.terms.previewSummary")}</DialogDescription>
                        </DialogHeader>
                        <p className="text-sm leading-relaxed text-muted-foreground">{t(previewKey)}</p>
                        <Button asChild variant="outline" size="sm" className="w-fit">
                          <Link href={doc.href} target="_blank" rel="noopener noreferrer">
                            {t("auth.terms.openFullPage")}
                          </Link>
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p
          id="ong-legal-acceptance-error"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
          aria-live="polite"
        >
          {tv(error) || t("auth.terms.acceptanceRequired")}
        </p>
      )}
    </section>
  );
}

export { ONG_LEGAL_ACCEPTANCE_MESSAGE };
