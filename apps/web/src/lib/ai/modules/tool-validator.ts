import type { BusinessToolDefinition } from "./types";

const SENSITIVE_PARAM_KEYS = [
  "password",
  "senha",
  "token",
  "jwt",
  "authorization",
  "cookie",
  "cpf",
  "cnpj",
  "card",
  "cartao",
  "cvv",
  "pix",
  "secret",
  "apiKey",
  "api_key",
];

export function stripSensitiveParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    const key = k.toLowerCase();
    if (SENSITIVE_PARAM_KEYS.some((s) => key.includes(s.toLowerCase()))) continue;
    if (typeof v === "string") {
      out[k] = v.slice(0, 500);
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.slice(0, 20);
    } else if (typeof v === "object" && v) {
      out[k] = stripSensitiveParams(v as Record<string, unknown>);
    }
  }
  return out;
}

export function validateToolParams(
  tool: BusinessToolDefinition,
  params: Record<string, unknown>
): { ok: true; params: Record<string, unknown> } | { ok: false; error: string } {
  const cleaned = stripSensitiveParams(params);
  for (const req of tool.parameters.required ?? []) {
    if (cleaned[req] === undefined || cleaned[req] === null || cleaned[req] === "") {
      return { ok: false, error: `Parâmetro obrigatório ausente: ${req}` };
    }
  }
  for (const [key, value] of Object.entries(cleaned)) {
    const schema = tool.parameters.properties[key];
    if (!schema) {
      delete cleaned[key];
      continue;
    }
    const t = typeof value;
    if (schema.type === "string" && t !== "string") {
      return { ok: false, error: `Parâmetro ${key} deve ser string` };
    }
    if (schema.type === "number" && t !== "number") {
      return { ok: false, error: `Parâmetro ${key} deve ser number` };
    }
    if (schema.type === "boolean" && t !== "boolean") {
      return { ok: false, error: `Parâmetro ${key} deve ser boolean` };
    }
  }
  return { ok: true, params: cleaned };
}

/** Remove campos sensíveis de resultados antes de enviar ao modelo. */
export function sanitizeToolResult(data: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (data == null) return data;
  if (typeof data === "string") return data.slice(0, 2_000);
  if (typeof data === "number" || typeof data === "boolean") return data;
  if (Array.isArray(data)) return data.slice(0, 30).map((x) => sanitizeToolResult(x, depth + 1));
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = k.toLowerCase();
      if (
        SENSITIVE_PARAM_KEYS.some((s) => key.includes(s.toLowerCase())) ||
        key.includes("phone") ||
        key.includes("telefone") ||
        key.includes("email") ||
        key.includes("password") ||
        key.includes("document") ||
        key.includes("medical") ||
        key.includes("card") ||
        key.includes("pix")
      ) {
        continue;
      }
      out[k] = sanitizeToolResult(v, depth + 1);
    }
    return out;
  }
  return null;
}
