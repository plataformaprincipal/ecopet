import type { LocaleCode } from "@/i18n/locales/registry";

/** Mapeia locale ECOPET → BCP-47 para Intl. */
function intlLocale(locale: LocaleCode | string): string {
  switch (locale) {
    case "pt-BR":
      return "pt-BR";
    case "en":
      return "en-US";
    case "es":
      return "es-ES";
    default:
      return locale;
  }
}

/**
 * Moeda. O EcoPet opera em BRL; a formatação respeita o idioma:
 * pt-BR/es → "R$ 25,90" · en → "R$ 25.90" (símbolo BRL, separadores locais).
 */
export function formatCurrency(
  value: number,
  locale: LocaleCode | string,
  currency = "BRL"
): string {
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

export function formatNumber(value: number, locale: LocaleCode | string): string {
  try {
    return new Intl.NumberFormat(intlLocale(locale)).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(
  date: string | number | Date,
  locale: LocaleCode | string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), options).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function formatDateTime(
  date: string | number | Date,
  locale: LocaleCode | string
): string {
  return formatDate(date, locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
