import type { LocaleCode } from "./config";
import { DEFAULT_LOCALE, detectBrowserLocale, isRtlLocale } from "./config";
import type { TranslationKey } from "./types";
import { resolveStaticMessage, getCachedDynamic } from "./resolver";
import { applyDocumentLocale, bootstrapLocale } from "./bootstrap";

export type TranslateFn = (key: TranslationKey, params?: Record<string, string>) => string;

export function createTranslator(locale: LocaleCode): TranslateFn {
  return (key, params) => {
    let text =
      getCachedDynamic(locale, key) ??
      resolveStaticMessage(locale, key) ??
      resolveStaticMessage(DEFAULT_LOCALE, key) ??
      key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
      }
    }
    return text;
  };
}

export { applyDocumentLocale, bootstrapLocale, detectBrowserLocale, DEFAULT_LOCALE, isRtlLocale };
