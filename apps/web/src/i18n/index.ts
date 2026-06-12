/**
 * ECOPET i18n — ponto de entrada público.
 *
 * Estrutura:
 *   src/i18n/locales/       — registro de idiomas + JSON estáticos
 *   src/i18n/translations/  — carregamento de bundles
 *   src/i18n/fallback/      — cadeias de fallback
 *   src/i18n/rtl/           — suporte RTL
 *   src/i18n/autoTranslate/ — tradução automática + cache
 *   src/i18n/detect.ts      — detecção navegador/país
 */
export {
  LOCALE_REGISTRY,
  LOCALE_CODES,
  LOCALE_REGIONS,
  STATIC_LOCALES,
  DEFAULT_LOCALE,
  LOCALES,
  type LocaleCode,
  type LocaleMeta,
  type LocaleRegion,
  type LocaleDefinition,
  isSupportedLocale,
  getLocaleDefinition,
  getLocaleMeta,
  getAllLocalesMeta,
  getLocalesByRegion,
  isRtlLocale,
} from "@/i18n/locales/registry";

export { getLocaleFallbackChain, needsAutoTranslate } from "@/i18n/fallback";
export {
  RTL_LOCALE_CODES,
  getDocumentDirection,
  applyDocumentDirection,
} from "@/i18n/rtl";
export {
  detectBrowserLocale,
  detectUserCountry,
  localeFromCountry,
  normalizeLocale,
  isValidLocaleCode,
} from "@/i18n/detect";
export {
  getStaticBundle,
  getAllStaticBundles,
  getFromTree,
  flattenStaticKeys,
  SOURCE_KEYS,
} from "@/i18n/translations/static";
export {
  translateKeysViaApi,
  fetchDynamicTranslation,
  prefetchLocaleBundle,
  prefetchFullLocaleBundle,
} from "@/i18n/autoTranslate/client";
