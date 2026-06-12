/** Regiões geográficas para agrupamento no seletor de idiomas */
export type LocaleRegion = "europe" | "middleEast" | "asia" | "africa";

export interface LocaleDefinition {
  code: string;
  nativeLabel: string;
  label: string;
  region: LocaleRegion;
  /** Bundle JSON local completo — demais idiomas usam auto-tradução + cache */
  hasStaticBundle: boolean;
}

/**
 * Registro central de idiomas ECOPET — adicionar novos idiomas apenas aqui.
 * Total: 92 idiomas nativos.
 */
export const LOCALE_REGISTRY = [
  // —— Europa ——
  { code: "pt-BR", nativeLabel: "Português (Brasil)", label: "Portuguese (Brazil)", region: "europe", hasStaticBundle: true },
  { code: "pt-PT", nativeLabel: "Português (Portugal)", label: "Portuguese (Portugal)", region: "europe", hasStaticBundle: false },
  { code: "en", nativeLabel: "English", label: "English", region: "europe", hasStaticBundle: true },
  { code: "es", nativeLabel: "Español", label: "Spanish", region: "europe", hasStaticBundle: true },
  { code: "fr", nativeLabel: "Français", label: "French", region: "europe", hasStaticBundle: false },
  { code: "de", nativeLabel: "Deutsch", label: "German", region: "europe", hasStaticBundle: false },
  { code: "it", nativeLabel: "Italiano", label: "Italian", region: "europe", hasStaticBundle: false },
  { code: "nl", nativeLabel: "Nederlands", label: "Dutch", region: "europe", hasStaticBundle: false },
  { code: "ca", nativeLabel: "Català", label: "Catalan", region: "europe", hasStaticBundle: false },
  { code: "gl", nativeLabel: "Galego", label: "Galician", region: "europe", hasStaticBundle: false },
  { code: "eu", nativeLabel: "Euskara", label: "Basque", region: "europe", hasStaticBundle: false },
  { code: "ru", nativeLabel: "Русский", label: "Russian", region: "europe", hasStaticBundle: false },
  { code: "uk", nativeLabel: "Українська", label: "Ukrainian", region: "europe", hasStaticBundle: false },
  { code: "be", nativeLabel: "Беларуская", label: "Belarusian", region: "europe", hasStaticBundle: false },
  { code: "pl", nativeLabel: "Polski", label: "Polish", region: "europe", hasStaticBundle: false },
  { code: "cs", nativeLabel: "Čeština", label: "Czech", region: "europe", hasStaticBundle: false },
  { code: "sk", nativeLabel: "Slovenčina", label: "Slovak", region: "europe", hasStaticBundle: false },
  { code: "sl", nativeLabel: "Slovenščina", label: "Slovenian", region: "europe", hasStaticBundle: false },
  { code: "hr", nativeLabel: "Hrvatski", label: "Croatian", region: "europe", hasStaticBundle: false },
  { code: "sr", nativeLabel: "Српски", label: "Serbian", region: "europe", hasStaticBundle: false },
  { code: "bs", nativeLabel: "Bosanski", label: "Bosnian", region: "europe", hasStaticBundle: false },
  { code: "mk", nativeLabel: "Македонски", label: "Macedonian", region: "europe", hasStaticBundle: false },
  { code: "bg", nativeLabel: "Български", label: "Bulgarian", region: "europe", hasStaticBundle: false },
  { code: "ro", nativeLabel: "Română", label: "Romanian", region: "europe", hasStaticBundle: false },
  { code: "hu", nativeLabel: "Magyar", label: "Hungarian", region: "europe", hasStaticBundle: false },
  { code: "sq", nativeLabel: "Shqip", label: "Albanian", region: "europe", hasStaticBundle: false },
  { code: "el", nativeLabel: "Ελληνικά", label: "Greek", region: "europe", hasStaticBundle: false },
  { code: "da", nativeLabel: "Dansk", label: "Danish", region: "europe", hasStaticBundle: false },
  { code: "no", nativeLabel: "Norsk", label: "Norwegian", region: "europe", hasStaticBundle: false },
  { code: "sv", nativeLabel: "Svenska", label: "Swedish", region: "europe", hasStaticBundle: false },
  { code: "fi", nativeLabel: "Suomi", label: "Finnish", region: "europe", hasStaticBundle: false },
  { code: "is", nativeLabel: "Íslenska", label: "Icelandic", region: "europe", hasStaticBundle: false },
  { code: "et", nativeLabel: "Eesti", label: "Estonian", region: "europe", hasStaticBundle: false },
  { code: "lv", nativeLabel: "Latviešu", label: "Latvian", region: "europe", hasStaticBundle: false },
  { code: "lt", nativeLabel: "Lietuvių", label: "Lithuanian", region: "europe", hasStaticBundle: false },
  { code: "ga", nativeLabel: "Gaeilge", label: "Irish", region: "europe", hasStaticBundle: false },
  { code: "cy", nativeLabel: "Cymraeg", label: "Welsh", region: "europe", hasStaticBundle: false },
  { code: "mt", nativeLabel: "Malti", label: "Maltese", region: "europe", hasStaticBundle: false },
  { code: "lb", nativeLabel: "Lëtzebuergesch", label: "Luxembourgish", region: "europe", hasStaticBundle: false },

  // —— Oriente Médio e Ásia Central ——
  { code: "tr", nativeLabel: "Türkçe", label: "Turkish", region: "middleEast", hasStaticBundle: false },
  { code: "hy", nativeLabel: "Հայերեն", label: "Armenian", region: "middleEast", hasStaticBundle: false },
  { code: "ka", nativeLabel: "ქართული", label: "Georgian", region: "middleEast", hasStaticBundle: false },
  { code: "az", nativeLabel: "Azərbaycan", label: "Azerbaijani", region: "middleEast", hasStaticBundle: false },
  { code: "kk", nativeLabel: "Қазақ", label: "Kazakh", region: "middleEast", hasStaticBundle: false },
  { code: "uz", nativeLabel: "Oʻzbek", label: "Uzbek", region: "middleEast", hasStaticBundle: false },
  { code: "ky", nativeLabel: "Кыргызча", label: "Kyrgyz", region: "middleEast", hasStaticBundle: false },
  { code: "tg", nativeLabel: "Тоҷикӣ", label: "Tajik", region: "middleEast", hasStaticBundle: false },
  { code: "fa", nativeLabel: "فارسی", label: "Persian (Farsi)", region: "middleEast", hasStaticBundle: false },
  { code: "ku", nativeLabel: "Kurdî", label: "Kurdish", region: "middleEast", hasStaticBundle: false },
  { code: "ps", nativeLabel: "پښتو", label: "Pashto", region: "middleEast", hasStaticBundle: false },
  { code: "ar", nativeLabel: "العربية", label: "Arabic", region: "middleEast", hasStaticBundle: false },
  { code: "he", nativeLabel: "עברית", label: "Hebrew", region: "middleEast", hasStaticBundle: false },

  // —— Sul e Sudeste Asiático ——
  { code: "hi", nativeLabel: "हिन्दी", label: "Hindi", region: "asia", hasStaticBundle: false },
  { code: "ur", nativeLabel: "اردو", label: "Urdu", region: "asia", hasStaticBundle: false },
  { code: "bn", nativeLabel: "বাংলা", label: "Bengali", region: "asia", hasStaticBundle: false },
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ", label: "Punjabi", region: "asia", hasStaticBundle: false },
  { code: "gu", nativeLabel: "ગુજરાતી", label: "Gujarati", region: "asia", hasStaticBundle: false },
  { code: "mr", nativeLabel: "मराठी", label: "Marathi", region: "asia", hasStaticBundle: false },
  { code: "ta", nativeLabel: "தமிழ்", label: "Tamil", region: "asia", hasStaticBundle: false },
  { code: "te", nativeLabel: "తెలుగు", label: "Telugu", region: "asia", hasStaticBundle: false },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", label: "Kannada", region: "asia", hasStaticBundle: false },
  { code: "ml", nativeLabel: "മലയാളം", label: "Malayalam", region: "asia", hasStaticBundle: false },
  { code: "or", nativeLabel: "ଓଡ଼ିଆ", label: "Odia", region: "asia", hasStaticBundle: false },
  { code: "as", nativeLabel: "অসমীয়া", label: "Assamese", region: "asia", hasStaticBundle: false },
  { code: "ne", nativeLabel: "नेपाली", label: "Nepali", region: "asia", hasStaticBundle: false },
  { code: "si", nativeLabel: "සිංහල", label: "Sinhala", region: "asia", hasStaticBundle: false },
  { code: "zh-CN", nativeLabel: "中文（简体）", label: "Chinese (Simplified)", region: "asia", hasStaticBundle: false },
  { code: "zh-TW", nativeLabel: "中文（繁體）", label: "Chinese (Traditional)", region: "asia", hasStaticBundle: false },
  { code: "ja", nativeLabel: "日本語", label: "Japanese", region: "asia", hasStaticBundle: false },
  { code: "ko", nativeLabel: "한국어", label: "Korean", region: "asia", hasStaticBundle: false },
  { code: "vi", nativeLabel: "Tiếng Việt", label: "Vietnamese", region: "asia", hasStaticBundle: false },
  { code: "th", nativeLabel: "ไทย", label: "Thai", region: "asia", hasStaticBundle: false },
  { code: "id", nativeLabel: "Bahasa Indonesia", label: "Indonesian", region: "asia", hasStaticBundle: false },
  { code: "ms", nativeLabel: "Bahasa Melayu", label: "Malay", region: "asia", hasStaticBundle: false },
  { code: "tl", nativeLabel: "Filipino", label: "Filipino/Tagalog", region: "asia", hasStaticBundle: false },
  { code: "my", nativeLabel: "မြန်မာ", label: "Burmese", region: "asia", hasStaticBundle: false },
  { code: "km", nativeLabel: "ខ្មែរ", label: "Khmer", region: "asia", hasStaticBundle: false },
  { code: "lo", nativeLabel: "ລາວ", label: "Lao", region: "asia", hasStaticBundle: false },
  { code: "mn", nativeLabel: "Монгол", label: "Mongolian", region: "asia", hasStaticBundle: false },

  // —— África ——
  { code: "am", nativeLabel: "አማርኛ", label: "Amharic", region: "africa", hasStaticBundle: false },
  { code: "sw", nativeLabel: "Kiswahili", label: "Swahili", region: "africa", hasStaticBundle: false },
  { code: "ha", nativeLabel: "Hausa", label: "Hausa", region: "africa", hasStaticBundle: false },
  { code: "yo", nativeLabel: "Yorùbá", label: "Yoruba", region: "africa", hasStaticBundle: false },
  { code: "ig", nativeLabel: "Igbo", label: "Igbo", region: "africa", hasStaticBundle: false },
  { code: "zu", nativeLabel: "isiZulu", label: "Zulu", region: "africa", hasStaticBundle: false },
  { code: "xh", nativeLabel: "isiXhosa", label: "Xhosa", region: "africa", hasStaticBundle: false },
  { code: "af", nativeLabel: "Afrikaans", label: "Afrikaans", region: "africa", hasStaticBundle: false },
  { code: "so", nativeLabel: "Soomaali", label: "Somali", region: "africa", hasStaticBundle: false },
  { code: "sn", nativeLabel: "chiShona", label: "Shona", region: "africa", hasStaticBundle: false },
  { code: "rw", nativeLabel: "Kinyarwanda", label: "Kinyarwanda", region: "africa", hasStaticBundle: false },
  { code: "ln", nativeLabel: "Lingála", label: "Lingala", region: "africa", hasStaticBundle: false },
  { code: "st", nativeLabel: "Sesotho", label: "Sesotho", region: "africa", hasStaticBundle: false },
] as const satisfies readonly LocaleDefinition[];

export type LocaleCode = (typeof LOCALE_REGISTRY)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "pt-BR";

export const LOCALE_CODES = LOCALE_REGISTRY.map((l) => l.code) as LocaleCode[];

export const STATIC_LOCALES = LOCALE_REGISTRY.filter((l) => l.hasStaticBundle).map(
  (l) => l.code
) as LocaleCode[];

export type LocaleMeta = LocaleDefinition & { dir: "ltr" | "rtl" };

const registryByCode = new Map<string, LocaleDefinition>(
  LOCALE_REGISTRY.map((l) => [l.code, l])
);

export function isSupportedLocale(code: string): code is LocaleCode {
  return registryByCode.has(code);
}

export function getLocaleDefinition(code: LocaleCode): LocaleDefinition {
  return registryByCode.get(code)!;
}

export function getLocalesByRegion(region: LocaleRegion): LocaleDefinition[] {
  return LOCALE_REGISTRY.filter((l) => l.region === region);
}

export const LOCALE_REGIONS: { id: LocaleRegion; labelKey: string }[] = [
  { id: "europe", labelKey: "lang.regions.europe" },
  { id: "middleEast", labelKey: "lang.regions.middleEast" },
  { id: "asia", labelKey: "lang.regions.asia" },
  { id: "africa", labelKey: "lang.regions.africa" },
];

/** Metadados enriquecidos com direção de texto */
export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  const def = getLocaleDefinition(code);
  return {
    ...def,
    dir: isRtlLocale(code) ? "rtl" : "ltr",
  };
}

export function getAllLocalesMeta(): LocaleMeta[] {
  return LOCALE_CODES.map(getLocaleMeta);
}

/** @deprecated Use getAllLocalesMeta — mantido para compatibilidade */
export const LOCALES = getAllLocalesMeta();

import { isRtlLocale } from "@/i18n/rtl";

export { isRtlLocale };
