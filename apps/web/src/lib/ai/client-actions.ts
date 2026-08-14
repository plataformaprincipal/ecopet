/**
 * Allowlist de ações que o frontend pode executar a partir da IA.
 * O servidor nunca executa JS — apenas valida e devolve payload estruturado.
 */
import type { ClientActionName } from "@/lib/ai/modules/types";

export const ALLOWED_CLIENT_ACTIONS = [
  "SET_THEME",
  "SET_FONT_SCALE",
  "ENABLE_SIMPLE_LANGUAGE",
  "ENABLE_SIMPLIFIED_UI",
  "ENABLE_STRONG_FOCUS",
  "OPEN_ACCESSIBILITY",
  "OPEN_CART",
  "NAVIGATE",
  "OPEN_ADOPTION_FILTERS",
  "OPEN_MARKETPLACE_FILTERS",
  "REQUEST_GEOLOCATION",
] as const satisfies readonly ClientActionName[];

const ALLOWED_SET = new Set<string>(ALLOWED_CLIENT_ACTIONS);

export type ClientActionPayload = Record<string, unknown>;

export type ValidatedClientAction = {
  type: "CLIENT_ACTION";
  action: ClientActionName;
  payload: ClientActionPayload;
};

export function isAllowedClientAction(action: string): action is ClientActionName {
  return ALLOWED_SET.has(action);
}

/**
 * Só aceita rota interna relativa. Bloqueia origem externa, protocolo,
 * protocol-relative (`//host`) e travessia de caminho.
 */
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  const value = path.trim();
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("..")) return false;
  if (/[\\\s]/.test(value)) return false;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  return value.length <= 300;
}

/**
 * Valida action + payload. Rejeita ações arbitrárias fora da allowlist.
 */
export function validateClientAction(
  action: unknown,
  payload: unknown = {}
): { ok: true; value: ValidatedClientAction } | { ok: false; error: string } {
  if (typeof action !== "string" || !action.trim()) {
    return { ok: false, error: "Ação inválida." };
  }
  if (!isAllowedClientAction(action)) {
    return { ok: false, error: `Ação não permitida: ${action.slice(0, 64)}` };
  }

  let safePayload: ClientActionPayload = {};
  if (payload != null) {
    if (typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, error: "Payload deve ser um objeto." };
    }
    safePayload = sanitizePayload(payload as Record<string, unknown>);
  }

  return {
    ok: true,
    value: {
      type: "CLIENT_ACTION",
      action,
      payload: safePayload,
    },
  };
}

function sanitizePayload(input: Record<string, unknown>, depth = 0): ClientActionPayload {
  if (depth > 4) return {};
  const out: ClientActionPayload = {};
  for (const [k, v] of Object.entries(input).slice(0, 20)) {
    if (typeof v === "string") out[k] = v.slice(0, 500);
    else if (typeof v === "number" || typeof v === "boolean" || v === null) out[k] = v;
    else if (Array.isArray(v)) {
      out[k] = v.slice(0, 20).map((item) => {
        if (typeof item === "string") return item.slice(0, 200);
        if (typeof item === "number" || typeof item === "boolean" || item === null) return item;
        return null;
      });
    } else if (typeof v === "object" && v) {
      out[k] = sanitizePayload(v as Record<string, unknown>, depth + 1);
    }
  }
  return out;
}
