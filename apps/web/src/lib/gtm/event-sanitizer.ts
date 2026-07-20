import { sanitizeEventParams, isSafeEventName } from "@/lib/analytics/sanitize";

const EXTRA_BLOCKED = [
  "message",
  "prompt",
  "response_content",
  "stack",
  "pix_code",
  "card_number",
  "microchip",
  "latitude",
  "longitude",
  "fcm",
  "device_token",
];

/** Sanitização recursiva para objetos do Data Layer. */
export function sanitizeDataLayerParams(
  input?: Record<string, unknown> | null
): Record<string, string | number | boolean> {
  if (!input) return {};
  const flat: Record<string, string | number | boolean | undefined | null> = {};
  for (const [key, value] of Object.entries(input)) {
    const k = key.toLowerCase();
    if (EXTRA_BLOCKED.some((b) => k.includes(b))) continue;
    if (value == null) continue;
    if (typeof value === "object") {
      // não envia objetos aninhados crus — só primitivos
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      flat[key] = value;
    }
  }
  return sanitizeEventParams(flat);
}

/** Descarta termo de busca sensível. */
export function sanitizeSearchTerm(term: string | undefined | null): string | undefined {
  if (!term) return undefined;
  const t = term.trim().slice(0, 80);
  if (!t) return undefined;
  if (t.includes("@") && t.includes(".")) return undefined;
  if (/\d{11}/.test(t.replace(/\D/g, ""))) return undefined; // CPF-like
  if (/\d{10,}/.test(t.replace(/\D/g, ""))) return undefined; // phone-like
  if (/token|senha|password|bearer/i.test(t)) return undefined;
  return t;
}

export function assertSafeEventName(name: string): boolean {
  if (name.startsWith("ecopet_")) {
    return /^[a-z][a-z0-9_]{1,39}$/i.test(name);
  }
  return isSafeEventName(name);
}
