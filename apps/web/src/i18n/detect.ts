import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type LocaleCode,
  LOCALE_CODES,
} from "@/i18n/locales/registry";

/** Mapeamento BCP-47 / alias → locale ECOPET */
const NORMALIZE_MAP: Record<string, LocaleCode> = {
  pt: "pt-BR",
  "pt-BR": "pt-BR",
  "pt-br": "pt-BR",
  "pt-PT": "pt-PT",
  "pt-pt": "pt-PT",
  en: "en",
  "en-US": "en",
  "en-GB": "en",
  "en-AU": "en",
  es: "es",
  "es-ES": "es",
  "es-MX": "es",
  fr: "fr",
  de: "de",
  it: "it",
  nl: "nl",
  ca: "ca",
  gl: "gl",
  eu: "eu",
  ru: "ru",
  uk: "uk",
  be: "be",
  pl: "pl",
  cs: "cs",
  sk: "sk",
  sl: "sl",
  hr: "hr",
  sr: "sr",
  bs: "bs",
  mk: "mk",
  bg: "bg",
  ro: "ro",
  hu: "hu",
  sq: "sq",
  el: "el",
  da: "da",
  no: "no",
  nb: "no",
  nn: "no",
  sv: "sv",
  fi: "fi",
  is: "is",
  et: "et",
  lv: "lv",
  lt: "lt",
  ga: "ga",
  cy: "cy",
  mt: "mt",
  lb: "lb",
  tr: "tr",
  hy: "hy",
  ka: "ka",
  az: "az",
  kk: "kk",
  uz: "uz",
  ky: "ky",
  tg: "tg",
  fa: "fa",
  ku: "ku",
  ps: "ps",
  ar: "ar",
  he: "he",
  hi: "hi",
  ur: "ur",
  bn: "bn",
  pa: "pa",
  gu: "gu",
  mr: "mr",
  ta: "ta",
  te: "te",
  kn: "kn",
  ml: "ml",
  or: "or",
  as: "as",
  ne: "ne",
  si: "si",
  zh: "zh-CN",
  "zh-CN": "zh-CN",
  "zh-cn": "zh-CN",
  "zh-Hans": "zh-CN",
  "zh-TW": "zh-TW",
  "zh-tw": "zh-TW",
  "zh-Hant": "zh-TW",
  ja: "ja",
  ko: "ko",
  vi: "vi",
  th: "th",
  id: "id",
  ms: "ms",
  tl: "tl",
  fil: "tl",
  my: "my",
  km: "km",
  lo: "lo",
  mn: "mn",
  am: "am",
  sw: "sw",
  ha: "ha",
  yo: "yo",
  ig: "ig",
  zu: "zu",
  xh: "xh",
  af: "af",
  so: "so",
  sn: "sn",
  rw: "rw",
  ln: "ln",
  st: "st",
};

/** País (ISO 3166-1 alpha-2) → locale preferido */
const COUNTRY_LOCALE_MAP: Record<string, LocaleCode> = {
  BR: "pt-BR",
  PT: "pt-PT",
  US: "en",
  GB: "en",
  AU: "en",
  CA: "en",
  ES: "es",
  MX: "es",
  AR: "es",
  FR: "fr",
  DE: "de",
  IT: "it",
  NL: "nl",
  RU: "ru",
  UA: "uk",
  BY: "be",
  PL: "pl",
  CZ: "cs",
  SK: "sk",
  SI: "sl",
  HR: "hr",
  RS: "sr",
  BA: "bs",
  MK: "mk",
  BG: "bg",
  RO: "ro",
  HU: "hu",
  AL: "sq",
  GR: "el",
  DK: "da",
  NO: "no",
  SE: "sv",
  FI: "fi",
  IS: "is",
  EE: "et",
  LV: "lv",
  LT: "lt",
  IE: "ga",
  MT: "mt",
  LU: "lb",
  TR: "tr",
  AM: "hy",
  GE: "ka",
  AZ: "az",
  KZ: "kk",
  UZ: "uz",
  KG: "ky",
  TJ: "tg",
  IR: "fa",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  IL: "he",
  IN: "hi",
  PK: "ur",
  BD: "bn",
  CN: "zh-CN",
  TW: "zh-TW",
  HK: "zh-TW",
  JP: "ja",
  KR: "ko",
  VN: "vi",
  TH: "th",
  ID: "id",
  MY: "ms",
  PH: "tl",
  MM: "my",
  KH: "km",
  LA: "lo",
  MN: "mn",
  ET: "am",
  KE: "sw",
  TZ: "sw",
  NG: "ha",
  ZA: "af",
  SO: "so",
  ZW: "sn",
  RW: "rw",
  CD: "ln",
  LS: "st",
};

export function normalizeLocale(input: string): LocaleCode | null {
  const trimmed = input.trim();
  if (NORMALIZE_MAP[trimmed]) return NORMALIZE_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  if (NORMALIZE_MAP[lower]) return NORMALIZE_MAP[lower];
  const base = trimmed.split("-")[0];
  if (NORMALIZE_MAP[base]) return NORMALIZE_MAP[base];
  if (isSupportedLocale(trimmed)) return trimmed as LocaleCode;
  return null;
}

export function detectUserCountry(): string | null {
  if (typeof navigator === "undefined") return null;
  try {
    const locale = new Intl.Locale(navigator.language);
    return locale.region ?? null;
  } catch {
    const parts = navigator.language.split("-");
    return parts.length > 1 ? parts[1].toUpperCase() : null;
  }
}

export function localeFromCountry(country: string | null): LocaleCode | null {
  if (!country) return null;
  const code = COUNTRY_LOCALE_MAP[country.toUpperCase()];
  return code && isSupportedLocale(code) ? code : null;
}

/**
 * Detecta locale inicial (sem preferência salva):
 * 1. Idiomas do navegador (navigator.languages)
 * 2. País do usuário (Intl.Locale region)
 * 3. pt-BR padrão
 */
export function detectBrowserLocale(): LocaleCode {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const lang of langs) {
    const normalized = normalizeLocale(lang);
    if (normalized) return normalized;
  }

  const fromCountry = localeFromCountry(detectUserCountry());
  if (fromCountry) return fromCountry;

  return DEFAULT_LOCALE;
}

export function isValidLocaleCode(code: string): code is LocaleCode {
  return isSupportedLocale(code);
}

export { LOCALE_CODES };
