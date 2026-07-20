import type { UserRole } from "@prisma/client";
import { canAccessModule } from "@/lib/ai/ai-policy";
import { AI_RUNTIME_ERROR_CODES, AiRuntimeError } from "@/lib/ai/ai-errors";
import { resolveAssistantPersona } from "./personas";

export function assertAssistantAccess(role: UserRole): void {
  if (!canAccessModule(role, "ecopet-ai")) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.PERSONA_INVALID,
      "Sem permissão para o Assistente Virtual.",
      403
    );
  }
}

export { resolveAssistantPersona };
