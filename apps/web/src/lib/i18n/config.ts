/** Locales suportados pela ECOPET — expansível sem alterar componentes */
export type LocaleCode =
  | "pt-BR"
  | "en"
  | "es"
  | "fr"
  | "it"
  | "de"
  | "ja"
  | "zh"
  | "ko"
  | "ar"
  | "hi";

export const DEFAULT_LOCALE: LocaleCode = "pt-BR";

/** Idiomas com bundle estático completo (evita traduções incompletas manuais) */
export const STATIC_LOCALES: LocaleCode[] = ["pt-BR", "en", "es"];

/** Fallback chain para locales sem bundle */
export const LOCALE_FALLBACK: Record<LocaleCode, LocaleCode[]> = {
  "pt-BR": [],
  en: ["pt-BR"],
  es: ["pt-BR"],
  fr: ["en", "pt-BR"],
  it: ["en", "pt-BR"],
  de: ["en", "pt-BR"],
  ja: ["en", "pt-BR"],
  zh: ["en", "pt-BR"],
  ko: ["en", "pt-BR"],
  ar: ["en", "pt-BR"],
  hi: ["en", "pt-BR"],
};

export const RTL_LOCALES: LocaleCode[] = ["ar"];

export interface LocaleMeta {
  code: LocaleCode;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
  hasStaticBundle: boolean;
}

export const LOCALES: LocaleMeta[] = [
  { code: "pt-BR", label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)", dir: "ltr", hasStaticBundle: true },
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr", hasStaticBundle: true },
  { code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr", hasStaticBundle: true },
  { code: "fr", label: "French", nativeLabel: "Français", dir: "ltr", hasStaticBundle: false },
  { code: "it", label: "Italian", nativeLabel: "Italiano", dir: "ltr", hasStaticBundle: false },
  { code: "de", label: "German", nativeLabel: "Deutsch", dir: "ltr", hasStaticBundle: false },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", dir: "ltr", hasStaticBundle: false },
  { code: "zh", label: "Chinese", nativeLabel: "中文", dir: "ltr", hasStaticBundle: false },
  { code: "ko", label: "Korean", nativeLabel: "한국어", dir: "ltr", hasStaticBundle: false },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl", hasStaticBundle: false },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr", hasStaticBundle: false },
];

export function isRtlLocale(locale: LocaleCode): boolean {
  return RTL_LOCALES.includes(locale);
}

export function normalizeLocale(input: string): LocaleCode {
  const map: Record<string, LocaleCode> = {
    pt: "pt-BR",
    "pt-BR": "pt-BR",
    "pt-br": "pt-BR",
    en: "en",
    "en-US": "en",
    es: "es",
    fr: "fr",
    it: "it",
    de: "de",
    ja: "ja",
    zh: "zh",
    "zh-CN": "zh",
    ko: "ko",
    ar: "ar",
    hi: "hi",
  };
  return map[input] ?? map[input.split("-")[0]] ?? DEFAULT_LOCALE;
}

export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    const normalized = normalizeLocale(lang);
    if (LOCALES.some((l) => l.code === normalized)) return normalized;
  }
  return DEFAULT_LOCALE;
}
