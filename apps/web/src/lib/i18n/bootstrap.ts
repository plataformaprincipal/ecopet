import type { LocaleCode } from "@/i18n/locales/registry";
import { DEFAULT_LOCALE } from "@/i18n/locales/registry";
import { applyDocumentDirection } from "@/i18n/rtl";
import { needsAutoTranslate } from "@/i18n/fallback";
import type { TranslationKey } from "./types";
import { resolveStaticMessage, getCachedDynamic } from "./resolver";
import { PRIORITY_TRANSLATION_KEYS } from "./constants";
import { prefetchLocaleBundle, prefetchFullLocaleBundle } from "@/i18n/autoTranslate/client";
import { SOURCE_KEYS } from "@/i18n/translations/static";

let prefetchCount = 0;
const MAX_PREFETCH_SESSIONS = 3;

function scheduleIdle(task: () => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 4000 });
  } else {
    setTimeout(task, 2500);
  }
}

/** Aplica locale e direção no DOM — síncrono, zero rede */
export function applyDocumentLocale(locale: LocaleCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  applyDocumentDirection(locale);
}

/**
 * Bootstrap: prefetch idle das chaves prioritárias e, em seguida, bundle completo
 * para idiomas sem tradução local (auto-tradução + cache).
 */
export function bootstrapLocale(locale: LocaleCode): void {
  applyDocumentLocale(locale);

  if (!needsAutoTranslate(locale)) return;
  if (prefetchCount >= MAX_PREFETCH_SESSIONS) return;

  scheduleIdle(() => {
    if (prefetchCount >= MAX_PREFETCH_SESSIONS) return;

    const priorityBatch: Record<string, string> = {};
    for (const key of PRIORITY_TRANSLATION_KEYS) {
      if (getCachedDynamic(locale, key)) continue;
      const source = resolveStaticMessage(DEFAULT_LOCALE, key);
      if (source) priorityBatch[key] = source;
    }

    if (Object.keys(priorityBatch).length > 0) {
      prefetchCount += 1;
      prefetchLocaleBundle(locale, priorityBatch).then(() => {
        scheduleIdle(() => {
          prefetchFullLocaleBundle(locale, SOURCE_KEYS).catch(() => undefined);
        });
      }).catch(() => undefined);
    } else {
      prefetchFullLocaleBundle(locale, SOURCE_KEYS).catch(() => undefined);
    }
  });
}
