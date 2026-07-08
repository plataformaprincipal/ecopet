export const AI_ERROR_CODES = {
  PROVIDER_NOT_CONFIGURED: "AI_PROVIDER_NOT_CONFIGURED",
  AGENT_FORBIDDEN: "AGENT_FORBIDDEN",
  MODERATION_BLOCKED: "MODERATION_BLOCKED",
  VALIDATION: "VALIDATION",
  AI_ERROR: "AI_ERROR",
} as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

export const AI_PROVIDER_NOT_CONFIGURED_MESSAGE = "AI Provider not configured.";

export class AiProviderNotConfiguredError extends Error {
  readonly code = AI_ERROR_CODES.PROVIDER_NOT_CONFIGURED;

  constructor(message = AI_PROVIDER_NOT_CONFIGURED_MESSAGE) {
    super(message);
    this.name = "AiProviderNotConfiguredError";
  }
}

export function isAiProviderNotConfiguredError(error: unknown): error is AiProviderNotConfiguredError {
  return error instanceof AiProviderNotConfiguredError;
}
