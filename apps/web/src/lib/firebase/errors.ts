export class FirebaseConfigError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "FirebaseConfigError";
    this.code = code;
  }
}

export class FirebaseMessagingError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = "FirebaseMessagingError";
    this.code = code;
    this.retryable = retryable;
  }
}

/** Códigos FCM que invalidam o token permanentemente. */
export const PERMANENT_TOKEN_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
  "messaging/mismatched-credential",
  "messaging/sender-id-mismatch",
  "registration-token-not-registered",
  "invalid-registration-token",
  "invalid-argument",
  "mismatched-credential",
  "sender-id-mismatch",
]);

/** Erros temporários — retry com backoff. */
export const TRANSIENT_ERROR_CODES = new Set([
  "messaging/server-unavailable",
  "messaging/internal-error",
  "messaging/unknown-error",
  "messaging/quota-exceeded",
  "unavailable",
  "internal",
  "resource-exhausted",
]);

export function classifyFcmError(code: string | undefined): {
  permanent: boolean;
  retryable: boolean;
  sanitizedCode: string;
} {
  const normalized = (code || "unknown").toLowerCase();
  if (PERMANENT_TOKEN_ERROR_CODES.has(normalized) || [...PERMANENT_TOKEN_ERROR_CODES].some((c) => normalized.includes(c))) {
    return { permanent: true, retryable: false, sanitizedCode: normalized.slice(0, 120) };
  }
  if (TRANSIENT_ERROR_CODES.has(normalized) || [...TRANSIENT_ERROR_CODES].some((c) => normalized.includes(c))) {
    return { permanent: false, retryable: true, sanitizedCode: normalized.slice(0, 120) };
  }
  return { permanent: false, retryable: false, sanitizedCode: normalized.slice(0, 120) };
}

/** Nunca incluir token, private key ou payload sensível. */
export function sanitizeErrorMessage(message: string | undefined): string {
  if (!message) return "UNKNOWN_ERROR";
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "[redacted]")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/gi, "[redacted-key]")
    .replace(/[A-Za-z0-9_-]{100,}/g, "[redacted-long]")
    .slice(0, 240);
}
