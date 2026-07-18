/**
 * Erros sanitizados do provedor Resend — nunca expor stack, chave ou payload bruto ao cliente.
 */

export type EmailErrorCode =
  | "EMAIL_NOT_CONFIGURED"
  | "RESEND_NOT_CONFIGURED"
  | "EMAIL_INVALID_RECIPIENT"
  | "EMAIL_DOMAIN_PENDING"
  | "EMAIL_UNAUTHORIZED"
  | "EMAIL_FORBIDDEN"
  | "EMAIL_RATE_LIMITED"
  | "EMAIL_VALIDATION_ERROR"
  | "EMAIL_TIMEOUT"
  | "EMAIL_UNAVAILABLE"
  | "EMAIL_DNS_ERROR"
  | "EMAIL_SEND_FAILED"
  | "EMAIL_CONFIGURATION_ERROR";

export type SanitizedEmailError = {
  code: EmailErrorCode;
  message: string;
  httpStatus?: number;
  retryable: boolean;
};

const SAFE_MESSAGES: Record<EmailErrorCode, string> = {
  EMAIL_NOT_CONFIGURED: "Serviço de e-mail não configurado.",
  RESEND_NOT_CONFIGURED: "Resend não configurado (RESEND_API_KEY ausente).",
  EMAIL_INVALID_RECIPIENT: "Destinatário de e-mail inválido.",
  EMAIL_DOMAIN_PENDING: "Domínio de e-mail pendente de verificação no Resend.",
  EMAIL_UNAUTHORIZED: "Credenciais de e-mail inválidas ou expiradas.",
  EMAIL_FORBIDDEN: "Envio de e-mail não autorizado para este remetente/domínio.",
  EMAIL_RATE_LIMITED: "Limite de envio de e-mail atingido. Tente novamente em breve.",
  EMAIL_VALIDATION_ERROR: "Dados do e-mail inválidos.",
  EMAIL_TIMEOUT: "Tempo esgotado ao contactar o provedor de e-mail.",
  EMAIL_UNAVAILABLE: "Provedor de e-mail temporariamente indisponível.",
  EMAIL_DNS_ERROR: "Falha de DNS ao contactar o provedor de e-mail.",
  EMAIL_SEND_FAILED: "Não foi possível enviar o e-mail.",
  EMAIL_CONFIGURATION_ERROR: "Configuração de e-mail incompleta ou inválida.",
};

export function sanitizeEmailErrorMessage(raw: string | undefined): string {
  if (!raw) return SAFE_MESSAGES.EMAIL_SEND_FAILED;
  return raw
    .replace(/re_[A-Za-z0-9_-]+/g, "re_***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=***")
    .slice(0, 280);
}

export function mapResendError(input: {
  statusCode?: number;
  name?: string;
  message?: string;
}): SanitizedEmailError {
  const status = input.statusCode;
  const name = (input.name || "").toLowerCase();
  const message = (input.message || "").toLowerCase();

  if (status === 401 || name.includes("unauthorized") || message.includes("api key")) {
    return { code: "EMAIL_UNAUTHORIZED", message: SAFE_MESSAGES.EMAIL_UNAUTHORIZED, httpStatus: 401, retryable: false };
  }
  if (status === 403 || name.includes("forbidden")) {
    return { code: "EMAIL_FORBIDDEN", message: SAFE_MESSAGES.EMAIL_FORBIDDEN, httpStatus: 403, retryable: false };
  }
  if (status === 422 || name.includes("validation")) {
    if (message.includes("domain") || message.includes("not verified") || message.includes("from")) {
      return {
        code: "EMAIL_DOMAIN_PENDING",
        message: SAFE_MESSAGES.EMAIL_DOMAIN_PENDING,
        httpStatus: 422,
        retryable: false,
      };
    }
    if (message.includes("to") || message.includes("recipient") || message.includes("email")) {
      return {
        code: "EMAIL_INVALID_RECIPIENT",
        message: SAFE_MESSAGES.EMAIL_INVALID_RECIPIENT,
        httpStatus: 422,
        retryable: false,
      };
    }
    return {
      code: "EMAIL_VALIDATION_ERROR",
      message: SAFE_MESSAGES.EMAIL_VALIDATION_ERROR,
      httpStatus: 422,
      retryable: false,
    };
  }
  if (status === 429 || name.includes("rate") || message.includes("rate limit")) {
    return { code: "EMAIL_RATE_LIMITED", message: SAFE_MESSAGES.EMAIL_RATE_LIMITED, httpStatus: 429, retryable: true };
  }
  if (status === 408 || name.includes("timeout") || message.includes("timeout") || message.includes("aborted")) {
    return { code: "EMAIL_TIMEOUT", message: SAFE_MESSAGES.EMAIL_TIMEOUT, httpStatus: 504, retryable: true };
  }
  if (status && status >= 500) {
    return { code: "EMAIL_UNAVAILABLE", message: SAFE_MESSAGES.EMAIL_UNAVAILABLE, httpStatus: status, retryable: true };
  }
  if (message.includes("enotfound") || message.includes("dns") || message.includes("getaddrinfo")) {
    return { code: "EMAIL_DNS_ERROR", message: SAFE_MESSAGES.EMAIL_DNS_ERROR, httpStatus: 502, retryable: true };
  }
  if (message.includes("domain") && (message.includes("not verified") || message.includes("pending"))) {
    return {
      code: "EMAIL_DOMAIN_PENDING",
      message: SAFE_MESSAGES.EMAIL_DOMAIN_PENDING,
      httpStatus: 422,
      retryable: false,
    };
  }

  return {
    code: "EMAIL_SEND_FAILED",
    message: SAFE_MESSAGES.EMAIL_SEND_FAILED,
    httpStatus: status && status >= 400 ? status : 502,
    retryable: Boolean(status && status >= 500),
  };
}

export function publicEmailError(code: EmailErrorCode): SanitizedEmailError {
  return {
    code,
    message: SAFE_MESSAGES[code],
    retryable: code === "EMAIL_RATE_LIMITED" || code === "EMAIL_TIMEOUT" || code === "EMAIL_UNAVAILABLE",
  };
}
