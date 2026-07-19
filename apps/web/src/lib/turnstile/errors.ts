import type { TurnstileErrorCode } from "./types";

/** Mensagens públicas genéricas (cliente traduz via i18n). */
export const TURNSTILE_PUBLIC_MESSAGES: Record<TurnstileErrorCode, string> = {
  NOT_CONFIGURED: "Serviço de verificação temporariamente indisponível.",
  DISABLED: "Serviço de verificação temporariamente indisponível.",
  TOKEN_MISSING: "Verificação necessária. Conclua o desafio para continuar.",
  TOKEN_INVALID: "Não foi possível verificar. Tente novamente.",
  TOKEN_MALFORMED: "Não foi possível verificar. Tente novamente.",
  TOKEN_EXPIRED: "Verificação expirada. Conclua o desafio novamente.",
  TOKEN_REUSED: "Não foi possível verificar. Tente novamente.",
  ACTION_MISMATCH: "Não foi possível verificar. Tente novamente.",
  HOSTNAME_MISMATCH: "Não foi possível verificar. Tente novamente.",
  CLOUDFLARE_REJECTED: "Não foi possível verificar. Tente novamente.",
  CLOUDFLARE_UNAVAILABLE: "Serviço temporariamente indisponível. Tente novamente.",
  TIMEOUT: "Serviço temporariamente indisponível. Tente novamente.",
  INVALID_RESPONSE: "Serviço temporariamente indisponível. Tente novamente.",
  BYPASS_FORBIDDEN: "Não foi possível verificar. Tente novamente.",
  UNEXPECTED: "Não foi possível verificar. Tente novamente.",
};

export function turnstilePublicMessage(code: TurnstileErrorCode): string {
  return TURNSTILE_PUBLIC_MESSAGES[code] ?? TURNSTILE_PUBLIC_MESSAGES.UNEXPECTED;
}

/** Mapeia error-codes do Cloudflare para códigos internos sanitizados. */
export function mapCloudflareErrorCodes(codes: string[] | undefined): TurnstileErrorCode {
  if (!codes?.length) return "CLOUDFLARE_REJECTED";
  const joined = codes.join(",");
  if (joined.includes("timeout-or-duplicate") || joined.includes("timeout")) {
    return "TOKEN_EXPIRED";
  }
  if (joined.includes("invalid-input-response") || joined.includes("missing-input-response")) {
    return "TOKEN_INVALID";
  }
  if (joined.includes("bad-request")) return "TOKEN_MALFORMED";
  if (joined.includes("internal-error")) return "CLOUDFLARE_UNAVAILABLE";
  return "CLOUDFLARE_REJECTED";
}
