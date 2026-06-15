const SECRET_KEYS = /password|secret|token|apikey|api_key|credential|hash|jwt/i;

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

export function maskEmail(value?: string | null): string | null {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function redactSecrets(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.test(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactSecrets(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

type SanitizeOptions = {
  maskCpfField?: boolean;
  maskCnpjField?: boolean;
  maskEmailField?: boolean;
  stripAddress?: boolean;
};

export function sanitizeApiResponse<T>(data: T, options: SanitizeOptions = {}): T {
  const {
    maskCpfField = true,
    maskCnpjField = true,
    maskEmailField = false,
    stripAddress = false,
  } = options;

  const redacted = redactSecrets(data) as Record<string, unknown>;

  function walk(obj: unknown): unknown {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(walk);
    const record = { ...(obj as Record<string, unknown>) };
    if (maskCpfField && typeof record.cpf === "string") record.cpf = maskCpf(record.cpf);
    if (maskCnpjField && typeof record.cnpj === "string") record.cnpj = maskCnpj(record.cnpj);
    if (maskEmailField && typeof record.email === "string") record.email = maskEmail(record.email);
    if (stripAddress) {
      delete record.address;
      delete record.zipCode;
    }
    for (const [k, v] of Object.entries(record)) {
      if (v && typeof v === "object") record[k] = walk(v);
    }
    return record;
  }

  return walk(redacted) as T;
}

export function sanitizeUserForApi<T extends Record<string, unknown>>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash: _ph, ...rest } = user as T & { passwordHash?: unknown };
  return sanitizeApiResponse(rest, { maskCpfField: false, maskCnpjField: false }) as Omit<T, "passwordHash">;
}
