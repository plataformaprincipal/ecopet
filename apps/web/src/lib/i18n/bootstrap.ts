import type { LocaleCode } from "./config";
import { DEFAULT_LOCALE } from "./config";
import type { TranslationKey } from "./types";
import { resolveStaticMessage, getCachedDynamic, needsAutoTranslate } from "./resolver";
import { PRIORITY_TRANSLATION_KEYS, MAX_PREFETCH_PER_SESSION } from "./constants";
import { prefetchLocaleBundle } from "./translation-client";

let prefetchCount = 0;

function scheduleIdle(task: () => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 4000 });
  } else {
    setTimeout(task, 2500);
  }
}

/** Aplica locale no DOM — síncrono, zero rede */
export function applyDocumentLocale(locale: LocaleCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

/**
 * Bootstrap leve: NUNCA dispara batch completo automaticamente.
 * Prefetch idle opcional só das chaves prioritárias, com limite por sessão.
 */
export function bootstrapLocale(locale: LocaleCode): void {
  applyDocumentLocale(locale);

  if (!needsAutoTranslate(locale)) return;
  if (prefetchCount >= MAX_PREFETCH_PER_SESSION) return;

  const allCached = PRIORITY_TRANSLATION_KEYS.every((k) => getCachedDynamic(locale, k));
  if (allCached) return;

  scheduleIdle(() => {
    if (prefetchCount >= MAX_PREFETCH_PER_SESSION) return;

    const batch: Record<string, string> = {};
    for (const key of PRIORITY_TRANSLATION_KEYS) {
      if (getCachedDynamic(locale, key)) continue;
      const source = resolveStaticMessage(DEFAULT_LOCALE, key as TranslationKey);
      if (source) batch[key] = source;
    }

    if (Object.keys(batch).length === 0) return;

    prefetchCount += 1;
    prefetchLocaleBundle(locale, batch).catch(() => {
      /* fallback: cadeia estática pt → en permanece ativa */
    });
  });
}