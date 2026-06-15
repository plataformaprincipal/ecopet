const SECRET_KEYS = /password|secret|token|apikey|api_key|credential|hash/i;

export function maskCpf(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 2) return "***";
  return `***.***.***-${digits.slice(-2)}`;
}

export function maskCnpj(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 2) return "**";
  return `**.***.***/****-${digits.slice(-2)}`;
}

export function sanitizeMetadata(meta: unknown): unknown {
  if (!meta || typeof meta !== "object") return meta ?? null;
  if (Array.isArray(meta)) return meta.map(sanitizeMetadata);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    if (SECRET_KEYS.test(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = sanitizeMetadata(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function redactSecretLikeText(text?: string | null): string | undefined {
  if (!text) return text ?? undefined;
  return text.replace(/\b[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|API_KEY)[A-Z0-9_]*\b/gi, "[ENV_VAR]");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
