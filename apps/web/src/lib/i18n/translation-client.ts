import { API_URL } from "@/lib/constants";
import type { LocaleCode } from "./config";
import type { TranslationKey } from "./types";
import { cacheDynamicTranslation, getCachedDynamic } from "./resolver";

const LS_CACHE_KEY = "ecopet-i18n-dynamic-cache";

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
    /* quota */
  }
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

export async function prefetchLocaleBundle(locale: LocaleCode, keys: Record<string, string>) {
  try {
    const translations = await translateKeysViaApi(keys, locale);
    const ls = loadLsCache();
    for (const [key, text] of Object.entries(translations)) {
      cacheDynamicTranslation(locale, key as TranslationKey, text);
      ls[`${locale}:${key}`] = text;
    }
    saveLsCache(ls);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ecopet-i18n-updated", { detail: { locale } }));
    }
  } catch {
    /* fallback to static chain */
  }
}
