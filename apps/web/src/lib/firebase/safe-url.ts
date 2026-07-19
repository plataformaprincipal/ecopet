/**
 * Valida URLs de clique de notificação — apenas rotas internas relativas.
 * Impede open redirect e URLs externas arbitrárias.
 */

const BLOCKED_SCHEMES = /^(https?:|javascript:|data:|vbscript:|file:)/i;

const ALLOWED_PREFIXES = [
  "/client/",
  "/partner/",
  "/ngo/",
  "/ong/",
  "/admin/",
  "/notifications",
  "/notificacoes",
  "/mensagens",
  "/messages",
  "/agenda",
  "/pedidos/",
  "/orders/",
  "/social/",
  "/marketplace/",
  "/settings",
  "/configuracoes",
  "/suporte",
  "/support",
  "/financeiro",
];

export function sanitizeNotificationUrl(raw: string | undefined | null): string {
  if (!raw || typeof raw !== "string") return "/notifications";
  const trimmed = raw.trim();
  if (!trimmed || BLOCKED_SCHEMES.test(trimmed)) return "/notifications";
  if (trimmed.startsWith("//")) return "/notifications";
  if (!trimmed.startsWith("/")) return "/notifications";
  if (trimmed.includes("\\") || trimmed.includes("@")) return "/notifications";

  const path = trimmed.split("?")[0].split("#")[0];
  const allowed =
    path === "/" ||
    ALLOWED_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p));

  if (!allowed) return "/notifications";

  // Limitar querystring simples
  const qIndex = trimmed.indexOf("?");
  if (qIndex === -1) return path;
  const qs = trimmed.slice(qIndex + 1).slice(0, 200);
  if (/[<>'"]/.test(qs)) return path;
  return `${path}?${qs}`;
}

export function isSafeInternalNotificationUrl(raw: string | undefined | null): boolean {
  if (!raw) return false;
  return sanitizeNotificationUrl(raw) === raw.trim().split("#")[0] ||
    sanitizeNotificationUrl(raw).startsWith(raw.trim().split("?")[0]);
}
