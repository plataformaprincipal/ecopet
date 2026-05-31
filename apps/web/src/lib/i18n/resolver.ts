import type { LocaleCode } from "./config";
import type { MessageTree, TranslationKey } from "./types";
import ptBR from "./messages/pt-BR";
import en from "./messages/en";
import es from "./messages/es";
import { LOCALE_FALLBACK, STATIC_LOCALES } from "./config";

const staticBundles: Partial<Record<LocaleCode, MessageTree>> = {
  "pt-BR": ptBR,
  en,
  es,
};

/** Cache dinâmico (API) — locale → key → texto */
const dynamicCache = new Map<string, string>();

export function getFromTree(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let node: string | MessageTree = tree;
  for (const part of parts) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function resolveStaticMessage(locale: LocaleCode, key: TranslationKey): string | undefined {
  const chain = [locale, ...(LOCALE_FALLBACK[locale] ?? [])];
  for (const loc of chain) {
    const bundle = staticBundles[loc];
    if (!bundle) continue;
    const msg = getFromTree(bundle, key);
    if (msg) return msg;
  }
  return getFromTree(ptBR, key);
}

export function cacheDynamicTranslation(locale: LocaleCode, key: TranslationKey, text: string) {
  dynamicCache.set(`${locale}:${key}`, text);
}

export function getCachedDynamic(locale: LocaleCode, key: TranslationKey): string | undefined {
  return dynamicCache.get(`${locale}:${key}`);
}

export function needsAutoTranslate(locale: LocaleCode): boolean {
  return !STATIC_LOCALES.includes(locale);
}

export function flattenStaticKeys(tree: MessageTree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[path] = v;
    else Object.assign(out, flattenStaticKeys(v, path));
  }
  return out;
}

export { staticBundles };
