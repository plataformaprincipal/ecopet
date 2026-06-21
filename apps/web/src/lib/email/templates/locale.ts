import { DEFAULT_PREFERENCES } from "@/lib/accessibility/types";

/** Idiomas com bundle completo de e-mail. */
export type EmailLocale = "pt-BR" | "en" | "es";

export const DEFAULT_EMAIL_LOCALE: EmailLocale = "pt-BR";

export function resolveEmailLocale(input?: string | null): EmailLocale {
  if (!input) return DEFAULT_EMAIL_LOCALE;
  const normalized = input.trim().toLowerCase();
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("pt")) return "pt-BR";
  return DEFAULT_EMAIL_LOCALE;
}

export function getUserEmailLocale(preferences: unknown): EmailLocale {
  if (!preferences || typeof preferences !== "object") {
    return resolveEmailLocale(DEFAULT_PREFERENCES.locale);
  }
  const record = preferences as Record<string, unknown>;
  const a11y = record.a11y;
  if (a11y && typeof a11y === "object" && "locale" in a11y) {
    return resolveEmailLocale(String((a11y as { locale?: string }).locale));
  }
  if (typeof record.locale === "string") {
    return resolveEmailLocale(record.locale);
  }
  return DEFAULT_EMAIL_LOCALE;
}

export function emailHtmlLang(locale: EmailLocale): string {
  if (locale === "en") return "en-US";
  if (locale === "es") return "es-ES";
  return "pt-BR";
}

/** Resolve locale a partir do header Accept-Language (cadastro / visitantes). */
export function localeFromAcceptLanguage(header: string | null): EmailLocale {
  if (!header) return DEFAULT_EMAIL_LOCALE;
  const first = header.split(",")[0]?.trim().split(";")[0]?.trim();
  return resolveEmailLocale(first);
}
