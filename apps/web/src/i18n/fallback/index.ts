import type { LocaleCode } from "@/i18n/locales/registry";
import { DEFAULT_LOCALE, STATIC_LOCALES } from "@/i18n/locales/registry";

/** Variantes regionais → locale canônico ECOPET */
const VARIANT_FALLBACK: Partial<Record<LocaleCode, LocaleCode[]>> = {
  "pt-PT": ["pt-BR"],
  "zh-CN": ["zh-TW"],
  "zh-TW": ["zh-CN"],
};

/** Idiomas com parentesco linguístico → fallback intermediário antes de en */
const FAMILY_FALLBACK: Partial<Record<string, LocaleCode>> = {
  pt: "pt-BR",
  es: "es",
  en: "en",
  fr: "fr",
  de: "de",
  it: "it",
  ru: "ru",
  ar: "ar",
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  hi: "hi",
};

/**
 * Cadeia de fallback para um locale:
 * 1. Variantes regionais (pt-PT → pt-BR)
 * 2. Mesma família se bundle estático existir
 * 3. English (en)
 * 4. Português Brasil (pt-BR) — fonte canônica
 */
export function getLocaleFallbackChain(locale: LocaleCode): LocaleCode[] {
  const chain: LocaleCode[] = [];
  const seen = new Set<string>();

  const add = (code: LocaleCode) => {
    if (seen.has(code) || code === locale) return;
    seen.add(code);
    chain.push(code);
  };

  for (const variant of VARIANT_FALLBACK[locale] ?? []) {
    add(variant);
  }

  const base = locale.split("-")[0];
  const family = FAMILY_FALLBACK[base];
  if (family && family !== locale) {
    add(family);
  }

  if (!STATIC_LOCALES.includes(locale)) {
    add("en");
  }

  add(DEFAULT_LOCALE);

  return chain;
}

export function needsAutoTranslate(locale: LocaleCode): boolean {
  return !STATIC_LOCALES.includes(locale);
}
