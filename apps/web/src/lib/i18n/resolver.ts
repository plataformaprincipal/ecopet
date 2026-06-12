import type { LocaleCode } from "@/i18n/locales/registry";
import { DEFAULT_LOCALE } from "@/i18n/locales/registry";
import type { TranslationKey } from "./types";
import { getLocaleFallbackChain, needsAutoTranslate } from "@/i18n/fallback";
import {
  getStaticBundle,
  getFromTree,
  flattenStaticKeys,
} from "@/i18n/translations/static";
import ptBR from "@/i18n/locales/pt-BR.json";
import type { MessageTree } from "./types";

/** Cache dinâmico (API / auto-tradução) — locale:key → texto */
const dynamicCache = new Map<string, string>();

export function resolveStaticMessage(locale: LocaleCode, key: TranslationKey): string | undefined {
  const chain = [locale, ...getLocaleFallbackChain(locale)];
  for (const loc of chain) {
    const bundle = getStaticBundle(loc);
    if (!bundle) continue;
    const msg = getFromTree(bundle, key);
    if (msg) return msg;
  }
  return getFromTree(ptBR as MessageTree, key);
}

export function cacheDynamicTranslation(locale: LocaleCode, key: TranslationKey, text: string) {
  dynamicCache.set(`${locale}:${key}`, text);
}

export function getCachedDynamic(locale: LocaleCode, key: TranslationKey): string | undefined {
  return dynamicCache.get(`${locale}:${key}`);
}

export { needsAutoTranslate, getFromTree, flattenStaticKeys };

export function getAllStaticBundles() {
  return {
    "pt-BR": ptBR,
  };
}
