import { apiFailure } from "@/lib/api-response";
import { AI_ERROR_CODES, AI_PROVIDER_NOT_CONFIGURED_MESSAGE, isAiProviderNotConfiguredError } from "@/lib/ai/errors";

export function aiProviderNotConfiguredResponse() {
  return apiFailure(AI_ERROR_CODES.PROVIDER_NOT_CONFIGURED, AI_PROVIDER_NOT_CONFIGURED_MESSAGE, 503);
}

export function mapAiErrorToResponse(error: unknown) {
  if (isAiProviderNotConfiguredError(error)) {
    return aiProviderNotConfiguredResponse();
  }
  if (error instanceof Error && error.message === "AGENT_FORBIDDEN") {
    return apiFailure("AGENT_FORBIDDEN", "Sem permissão para este agente.", 403);
  }
  return apiFailure(AI_ERROR_CODES.AI_ERROR, error instanceof Error ? error.message : "Erro na IA.", 500);
}
