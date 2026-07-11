export {
  AI_ERROR_CODES,
  AI_PROVIDER_NOT_CONFIGURED_MESSAGE,
  AiProviderNotConfiguredError,
  isAiProviderNotConfiguredError,
} from "@/lib/ai/errors";
export type { AiErrorCode } from "@/lib/ai/errors";

export const AI_RUNTIME_ERROR_CODES = {
  KEY_MISSING: "AI_KEY_MISSING",
  SESSION_MISSING: "AI_SESSION_MISSING",
  PERSONA_INVALID: "AI_PERSONA_INVALID",
  RATE_LIMIT: "AI_RATE_LIMIT",
  BUDGET_EXCEEDED: "AI_BUDGET_EXCEEDED",
  TIMEOUT: "AI_TIMEOUT",
  UNAVAILABLE: "AI_UNAVAILABLE",
  CONTENT_BLOCKED: "AI_CONTENT_BLOCKED",
  CONTEXT_INSUFFICIENT: "AI_CONTEXT_INSUFFICIENT",
  TOOL_FAILED: "AI_TOOL_FAILED",
  CONFIRMATION_REQUIRED: "AI_CONFIRMATION_REQUIRED",
  MODULE_DISABLED: "AI_MODULE_DISABLED",
  GLOBAL_PAUSED: "AI_GLOBAL_PAUSED",
} as const;

export type AiRuntimeErrorCode =
  | (typeof AI_RUNTIME_ERROR_CODES)[keyof typeof AI_RUNTIME_ERROR_CODES]
  | string;

export class AiRuntimeError extends Error {
  readonly code: AiRuntimeErrorCode;
  readonly status: number;

  constructor(code: AiRuntimeErrorCode, message: string, status = 400) {
    super(message);
    this.name = "AiRuntimeError";
    this.code = code;
    this.status = status;
  }
}

/** Mensagens seguras para o usuário — sem stack, chave ou prompt interno. */
export function userFacingAiMessage(code: string, locale: "pt-BR" | "en-US" | "es-ES" = "pt-BR"): string {
  const messages: Record<string, Record<"pt-BR" | "en-US" | "es-ES", string>> = {
    AI_KEY_MISSING: {
      "pt-BR": "Assistente indisponível no momento. Tente novamente mais tarde.",
      "en-US": "Assistant unavailable right now. Please try again later.",
      "es-ES": "Asistente no disponible en este momento. Inténtelo más tarde.",
    },
    AI_PROVIDER_NOT_CONFIGURED: {
      "pt-BR": "Assistente indisponível no momento. Tente novamente mais tarde.",
      "en-US": "Assistant unavailable right now. Please try again later.",
      "es-ES": "Asistente no disponible en este momento. Inténtelo más tarde.",
    },
    AI_RATE_LIMIT: {
      "pt-BR": "Você atingiu o limite diário de uso da IA. Tente novamente amanhã.",
      "en-US": "You reached the daily AI usage limit. Try again tomorrow.",
      "es-ES": "Alcanzó el límite diario de uso de la IA. Inténtelo mañana.",
    },
    AI_BUDGET_EXCEEDED: {
      "pt-BR": "O orçamento mensal de IA foi atingido. O recurso está temporariamente pausado.",
      "en-US": "The monthly AI budget was reached. The feature is temporarily paused.",
      "es-ES": "Se alcanzó el presupuesto mensual de IA. La función está pausada temporalmente.",
    },
    AI_TIMEOUT: {
      "pt-BR": "A resposta demorou demais. Tente novamente.",
      "en-US": "The response took too long. Please try again.",
      "es-ES": "La respuesta tardó demasiado. Inténtelo de nuevo.",
    },
    AI_UNAVAILABLE: {
      "pt-BR": "Serviço de IA temporariamente indisponível.",
      "en-US": "AI service temporarily unavailable.",
      "es-ES": "Servicio de IA temporalmente no disponible.",
    },
    AI_CONTENT_BLOCKED: {
      "pt-BR": "Conteúdo bloqueado pelas políticas de segurança.",
      "en-US": "Content blocked by safety policies.",
      "es-ES": "Contenido bloqueado por políticas de seguridad.",
    },
    AI_CONTEXT_INSUFFICIENT: {
      "pt-BR": "Não há informação suficiente para responder com segurança.",
      "en-US": "There is not enough information to answer safely.",
      "es-ES": "No hay información suficiente para responder con seguridad.",
    },
    AI_CONFIRMATION_REQUIRED: {
      "pt-BR": "Esta ação requer revisão e confirmação explícita.",
      "en-US": "This action requires review and explicit confirmation.",
      "es-ES": "Esta acción requiere revisión y confirmación explícita.",
    },
    AI_GLOBAL_PAUSED: {
      "pt-BR": "A IA está temporariamente pausada pela administração.",
      "en-US": "AI is temporarily paused by administration.",
      "es-ES": "La IA está temporalmente pausada por la administración.",
    },
  };

  return messages[code]?.[locale] ?? messages.AI_UNAVAILABLE[locale];
}
