import { API_URL } from "@/lib/constants";
import type { LocaleCode } from "@/i18n/locales/registry";
import type { TranslationKey } from "@/lib/i18n/types";
import {
  cacheDynamicTranslation,
  getCachedDynamic,
} from "@/lib/i18n/resolver";

const LS_CACHE_KEY = "ecopet-i18n-dynamic-cache";
const BATCH_SIZE = 50;

function loadLsCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLsCache(data: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded */
  }
}

function notifyUpdated(locale: LocaleCode) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ecopet-i18n-updated", { detail: { locale } }));
}

export async function translateKeysViaApi(
  keys: Record<string, string>,
  targetLocale: LocaleCode,
  sourceLocale: LocaleCode = "pt-BR"
): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/api/translate/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: keys, targetLocale, sourceLocale }),
  });
  if (!res.ok) throw new Error("Translation API failed");
  const data = (await res.json()) as { translations: Record<string, string> };
  return data.translations;
}

export async function fetchDynamicTranslation(
  locale: LocaleCode,
  key: TranslationKey,
  sourceText: string
): Promise<string> {
  const mem = getCachedDynamic(locale, key);
  if (mem) return mem;

  const ls = loadLsCache();
  const lsKey = `${locale}:${key}`;
  if (ls[lsKey]) {
    cacheDynamicTranslation(locale, key, ls[lsKey]);
    return ls[lsKey];
  }

  try {
    const res = await fetch(`${API_URL}/api/translate/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sourceText, targetLocale: locale, sourceLocale: "pt-BR" }),
    });
    if (!res.ok) return sourceText;
    const data = (await res.json()) as { translated: string };
    cacheDynamicTranslation(locale, key, data.translated);
    ls[lsKey] = data.translated;
    saveLsCache(ls);
    return data.translated;
  } catch {
    return sourceText;
  }
}

function persistBatch(locale: LocaleCode, translations: Record<string, string>) {
  const ls = loadLsCache();
  for (const [key, text] of Object.entries(translations)) {
    cacheDynamicTranslation(locale, key as TranslationKey, text);
    ls[`${locale}:${key}`] = text;
  }
  saveLsCache(ls);
  notifyUpdated(locale);
}

export async function prefetchLocaleBundle(locale: LocaleCode, keys: Record<string, string>) {
  try {
    const translations = await translateKeysViaApi(keys, locale);
    persistBatch(locale, translations);
  } catch {
    /* fallback chain permanece ativa */
  }
}

/** Prefetch completo em lotes — traduz todas as chaves fonte para o locale alvo */
export async function prefetchFullLocaleBundle(
  locale: LocaleCode,
  allKeys: Record<string, string>
): Promise<void> {
  const pending: Record<string, string> = {};
  for (const [key, text] of Object.entries(allKeys)) {
    if (getCachedDynamic(locale, key as TranslationKey)) continue;
    pending[key] = text;
  }

  const entries = Object.entries(pending);
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const slice = Object.fromEntries(entries.slice(i, i + BATCH_SIZE));
    if (Object.keys(slice).length === 0) continue;
    try {
      const translations = await translateKeysViaApi(slice, locale);
      persistBatch(locale, translations);
    } catch {
      break;
    }
  }
}

export { loadLsCache, saveLsCache, LS_CACHE_KEY };
