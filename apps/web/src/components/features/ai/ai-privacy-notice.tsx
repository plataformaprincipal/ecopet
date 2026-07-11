"use client";

import { AI_SAFETY_DISCLAIMER, normalizeLocale, type AiLocale } from "@/lib/ai/ai-disclaimer";

type Props = {
  locale?: string;
  className?: string;
};

export function AIPrivacyNotice({ locale, className }: Props) {
  const loc: AiLocale = normalizeLocale(locale);
  return (
    <aside
      role="note"
      aria-live="polite"
      className={
        className ??
        "rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
      }
    >
      {AI_SAFETY_DISCLAIMER[loc]}
    </aside>
  );
}
