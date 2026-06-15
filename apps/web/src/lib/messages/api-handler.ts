import { apiFailure } from "@/lib/api-response";
import { ChatError } from "@/lib/messages/utils";

export function handleChatRouteError(error: unknown) {
  if (error instanceof ChatError) {
    return apiFailure(error.code, error.message, error.status);
  }
  console.error("[chat]", error);
  return apiFailure("INTERNAL", "Erro interno. Tente novamente.", 500);
}
