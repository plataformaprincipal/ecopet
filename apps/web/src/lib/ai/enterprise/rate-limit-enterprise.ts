import type { UserRole } from "@prisma/client";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { enforceAssistantLimits } from "@/lib/ai/assistant/rate-limit";
import { AI_RUNTIME_ERROR_CODES, AiRuntimeError } from "@/lib/ai/ai-errors";

/** Limite por ferramenta (execuções / minuto). */
export function assertToolRateLimit(userId: string, toolName: string): void {
  const key = `ai:enterprise:tool:${toolName}:${userId}`;
  if (!checkAuthRateLimit(key, 20, 60_000)) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      `Limite da ferramenta ${toolName} atingido. Aguarde um momento.`,
      429
    );
  }
}

/** Limite por endpoint lógico. */
export function assertEndpointRateLimit(endpoint: string, ip?: string): void {
  const key = `ai:enterprise:endpoint:${endpoint}:${(ip || "unknown").slice(0, 64)}`;
  if (!checkAuthRateLimit(key, 90, 60_000)) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      "Muitas requisições neste endpoint.",
      429
    );
  }
}

/** Agrega limites enterprise: IP + perfil + sessão + endpoint. */
export async function enforceEnterpriseLimits(input: {
  userId: string;
  role: UserRole;
  ip?: string;
  conversationId?: string;
  endpoint?: string;
}): Promise<void> {
  if (input.endpoint) assertEndpointRateLimit(input.endpoint, input.ip);
  await enforceAssistantLimits(input.userId, input.ip, input.role, input.conversationId);
}
