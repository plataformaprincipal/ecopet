/**
 * Compat layer — re-exporta de @/i18n para imports legados (@/lib/i18n/config).
 * Preferir importar de @/i18n em código novo.
 */
export {
  DEFAULT_LOCALE,
  STATIC_LOCALES,
  LOCALES,
  LOCALE_REGIONS,
  LOCALE_CODES,
  LOCALE_REGISTRY,
  type LocaleCode,
  type LocaleMeta,
  type LocaleRegion,
  isSupportedLocale,
  getLocaleDefinition,
  getLocaleMeta,
  getAllLocalesMeta,
  getLocalesByRegion,
  isRtlLocale,
} from "@/i18n/locales/registry";

export { getLocaleFallbackChain } from "@/i18n/fallback";

/** @deprecated Use getLocaleFallbackChain(locale) — mantido para compatibilidade */
import type { LocaleCode } from "@/i18n/locales/registry";
import { getLocaleFallbackChain } from "@/i18n/fallback";

export const LOCALE_FALLBACK: Record<string, LocaleCode[]> = new Proxy(
  {} as Record<string, LocaleCode[]>,
  {
    get(_target, prop: string) {
      return getLocaleFallbackChain(prop as LocaleCode);
    },
  }
);

export {
  detectBrowserLocale,
  normalizeLocale,
  detectUserCountry,
  localeFromCountry,
} from "@/i18n/detect";
