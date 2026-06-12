/** Idiomas com layout RTL — document.documentElement.dir = "rtl" */
export const RTL_LOCALE_CODES = [
  "ar", // Árabe
  "ku", // Curdo
  "fa", // Persa (Farsi)
  "he", // Hebraico
  "ps", // Pashto
  "ur", // Urdu
] as const;

export type RtlLocaleCode = (typeof RTL_LOCALE_CODES)[number];

export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALE_CODES as readonly string[]).includes(locale);
}

export function getDocumentDirection(locale: string): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

export function applyDocumentDirection(locale: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.dir = getDocumentDirection(locale);
}
