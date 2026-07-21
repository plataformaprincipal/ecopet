/**
 * Redaction isomorfa (Node / Edge / browser) — sem `node:crypto`.
 */
import { redactSecrets } from "@/lib/security/sanitize";

const SENSITIVE_KEY =
  /password|senha|secret|token|authorization|cookie|apikey|api[_-]?key|access[_-]?token|refresh[_-]?token|cpf|document|card|cvv|pix|database_url|direct_url|bearer|jwt|private[_-]?key|webhook[_-]?secret/i;

const MAX_DEPTH = 8;
const MAX_STRING = 2_000;
const MAX_KEYS = 80;

export function redactForObservability(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return "[MAX_DEPTH]";

  if (typeof value === "string") {
    if (value.length > MAX_STRING) return `${value.slice(0, MAX_STRING)}…[truncated]`;
    if (/^sk_[a-zA-Z0-9]+/.test(value)) return "[REDACTED]";
    if (/Bearer\s+\S+/i.test(value)) return "[REDACTED]";
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (typeof value === "bigint") return value.toString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.slice(0, 500),
      stack: typeof value.stack === "string" ? value.stack.split("\n").slice(0, 8).join("\n") : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redactForObservability(v, depth + 1));
  }

  if (typeof value === "object") {
    const seen = new WeakSet<object>();
    const walk = (obj: object, d: number): unknown => {
      if (seen.has(obj)) return "[Circular]";
      seen.add(obj);
      const out: Record<string, unknown> = {};
      let count = 0;
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (count++ >= MAX_KEYS) {
          out._truncated = true;
          break;
        }
        if (SENSITIVE_KEY.test(k)) {
          out[k] = "[REDACTED]";
          continue;
        }
        if (v !== null && typeof v === "object") {
          out[k] = Array.isArray(v)
            ? (v as unknown[]).slice(0, 50).map((x) => redactForObservability(x, d + 1))
            : walk(v as object, d + 1);
        } else {
          out[k] = redactForObservability(v, d + 1);
        }
      }
      return out;
    };
    return walk(value as object, depth);
  }

  return String(value);
}

/** Pseudonimiza IDs para logs (hash estável, não criptográfico). */
export function hashIdentifier(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  const s = `ecopet:${id}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/sk_[a-zA-Z0-9]+/g, "[REDACTED]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF_REDACTED]")
    .slice(0, 500);
}

export function newCorrelationId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isValidCorrelationId(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.length < 8 || value.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/** Compat: reexport redactSecrets legado. */
export { redactSecrets };
