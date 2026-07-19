import type { FcmNotificationPayload, PushCategory } from "./types";
import { sanitizeNotificationUrl } from "./safe-url";

const DEFAULT_ICON = "/brand/ecopet-logo.png";
const DEFAULT_BADGE = "/brand/ecopet-logo.png";

const SENSITIVE_PATTERNS = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, // CPF-like
  /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, // CNPJ-like
  /\b(?:\d[ -]*?){13,19}\b/g, // card-like
  /Bearer\s+\S+/gi,
];

function redactSensitive(text: string): string {
  let out = text;
  for (const re of SENSITIVE_PATTERNS) {
    out = out.replace(re, "[oculto]");
  }
  return out.slice(0, 240);
}

export function buildFcmPayload(input: {
  title: string;
  body: string;
  url?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  notificationId?: string;
  category?: PushCategory;
  locale?: string;
  tag?: string;
  icon?: string;
}): FcmNotificationPayload {
  const title = redactSensitive((input.title || "EcoPet").trim()).slice(0, 80);
  const body = redactSensitive((input.body || "").trim()).slice(0, 180);
  const url = sanitizeNotificationUrl(input.url);

  return {
    title: title || "EcoPet",
    body: body || "Você tem uma nova atualização.",
    icon: input.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: input.tag || (input.notificationId ? `n-${input.notificationId}` : undefined),
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    url,
    locale: input.locale,
    notificationId: input.notificationId,
    category: input.category,
  };
}

/** Data strings only — FCM data payload exige Record<string, string>. */
export function toFcmDataRecord(payload: FcmNotificationPayload): Record<string, string> {
  const data: Record<string, string> = {
    title: payload.title,
    body: payload.body,
    url: payload.url || "/notifications",
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
  };
  if (payload.tag) data.tag = payload.tag;
  if (payload.type) data.type = payload.type;
  if (payload.entityType) data.entityType = payload.entityType;
  if (payload.entityId) data.entityId = payload.entityId;
  if (payload.locale) data.locale = payload.locale;
  if (payload.notificationId) data.notificationId = payload.notificationId;
  if (payload.category) data.category = payload.category;
  return data;
}

export function mapNotificationTypeToCategory(type: string | undefined): PushCategory {
  const t = (type || "").toUpperCase();
  if (t.includes("PAYMENT") || t.includes("REFUND")) return "payments";
  if (t.includes("ORDER") || t.includes("SHIP") || t.includes("DELIVER")) return "orders";
  if (t.includes("MESSAGE") || t.includes("CHAT")) return "messages";
  if (t.includes("APPOINTMENT") || t.includes("AGENDA") || t.includes("VACCINE")) return "appointments";
  if (t.includes("SOCIAL") || t.includes("LIKE") || t.includes("COMMENT") || t.includes("MENTION")) {
    return "social";
  }
  if (t.includes("SUPPORT") || t.includes("TICKET")) return "support";
  if (t.includes("CAMPAIGN") || t.includes("MARKETING") || t.includes("PROMO")) return "marketing";
  if (t.includes("SECURITY") || t.includes("FRAUD")) return "security";
  if (t.includes("ADMIN") || t.includes("WEBHOOK") || t.includes("SYSTEM")) return "admin";
  return "orders";
}
