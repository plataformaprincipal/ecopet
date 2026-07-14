import { apiFailure } from "@/lib/api-response";
import { AI_ERROR_CODES, isAiProviderNotConfiguredError } from "@/lib/ai/errors";
import { isAiNotConfiguredCode } from "@/lib/ai/ai-errors";
import {
  aiNotConfiguredResponse,
  AI_NOT_CONFIGURED_USER_MESSAGE,
} from "@/lib/integrations/integration-errors";

/** @deprecated Prefer aiNotConfiguredResponse — código canônico AI_NOT_CONFIGURED */
export function aiProviderNotConfiguredResponse() {
  return aiNotConfiguredResponse(AI_NOT_CONFIGURED_USER_MESSAGE);
}

export function mapAiErrorToResponse(error: unknown) {
  if (isAiProviderNotConfiguredError(error)) {
    return aiNotConfiguredResponse(AI_NOT_CONFIGURED_USER_MESSAGE);
  }
  if (error instanceof Error && isAiNotConfiguredCode((error as { code?: string }).code)) {
    return aiNotConfiguredResponse(error.message || AI_NOT_CONFIGURED_USER_MESSAGE);
  }
  if (error instanceof Error && error.message === "AGENT_FORBIDDEN") {
    return apiFailure("AGENT_FORBIDDEN", "Sem permissão para este agente.", 403);
  }
  return apiFailure(AI_ERROR_CODES.AI_ERROR, error instanceof Error ? error.message : "Erro na IA.", 500);
}
