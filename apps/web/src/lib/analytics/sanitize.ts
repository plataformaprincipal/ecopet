import type { AnalyticsEventParams } from "./types";

const BLOCKED_PARAM_KEYS = [
  "password",
  "senha",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "jwt",
  "secret",
  "cpf",
  "cnpj",
  "rg",
  "card",
  "cvv",
  "pan",
  "credit_card",
  "debit_card",
  "email",
  "phone",
  "telefone",
  "celular",
  "address",
  "endereco",
  "street",
  "cep",
  "zipcode",
  "latitude",
  "longitude",
  "medical",
  "medico",
  "diagnost",
  "clinical",
  "vaccine_notes",
  "health_notes",
  "financial",
  "bank_account",
  "pix_key",
];

const BLOCKED_EVENT_NAMES = ["password_submit", "payment_card", "auth_token"];

export function isSafeEventName(name: string): boolean {
  if (!name || name.length > 40) return false;
  if (!/^[a-z][a-z0-9_]{1,39}$/i.test(name)) return false;
  if (BLOCKED_EVENT_NAMES.includes(name.toLowerCase())) return false;
  return true;
}

export function sanitizeEventParams(
  params?: AnalyticsEventParams
): Record<string, string | number | boolean> {
  if (!params) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    const k = key.toLowerCase();
    if (BLOCKED_PARAM_KEYS.some((b) => k.includes(b))) continue;
    if (typeof value === "string") {
      // não enviar e-mails / tokens longos
      if (value.includes("@") && value.includes(".")) continue;
      if (value.length > 100) {
        out[key] = value.slice(0, 100);
      } else {
        out[key] = value;
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

export function sanitizePath(path: string): string {
  try {
    const [pathname, search = ""] = path.split("?");
    if (!search) return pathname || "/";
    const params = new URLSearchParams(search);
    for (const key of [...params.keys()]) {
      if (BLOCKED_PARAM_KEYS.some((b) => key.toLowerCase().includes(b))) {
        params.delete(key);
      }
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname || "/";
  } catch {
    return "/";
  }
}
