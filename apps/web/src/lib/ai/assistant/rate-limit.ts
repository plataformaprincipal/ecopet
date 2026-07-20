import type { UserRole } from "@prisma/client";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { enforceAiLimits, assertAiRequestRateLimit } from "@/lib/ai/ai-rate-limit";
import { AI_RUNTIME_ERROR_CODES, AiRuntimeError } from "@/lib/ai/ai-errors";

/** Limites por perfil (requests / minuto). */
const PROFILE_RPM: Record<string, number> = {
  CLIENT: 20,
  TUTOR: 20,
  PARTNER: 40,
  ONG: 30,
  ADMIN: 80,
};

/** Rate limit por IP (defesa em profundidade além do userId). */
export function assertAssistantIpRateLimit(ip: string | undefined): void {
  const key = (ip || "unknown").slice(0, 64);
  if (!checkAuthRateLimit(`ai:assistant:ip:${key}`, 60, 60_000)) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      "Muitas requisições deste IP. Aguarde um momento.",
      429
    );
  }
}

export function assertAssistantProfileRateLimit(userId: string, role: UserRole): void {
  const rpm = PROFILE_RPM[role] ?? 20;
  if (!checkAuthRateLimit(`ai:assistant:profile:${role}:${userId}`, rpm, 60_000)) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      "Limite do perfil atingido. Aguarde um momento.",
      429
    );
  }
}

export function assertAssistantSessionRateLimit(userId: string, conversationId?: string): void {
  const sessionKey = conversationId
    ? `ai:assistant:session:${conversationId}`
    : `ai:assistant:session:user:${userId}`;
  if (!checkAuthRateLimit(sessionKey, 30, 60_000)) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      "Muitas mensagens nesta conversa. Aguarde um momento.",
      429
    );
  }
}

export async function enforceAssistantLimits(
  userId: string,
  ip?: string,
  role?: UserRole,
  conversationId?: string
): Promise<void> {
  assertAssistantIpRateLimit(ip);
  if (role) assertAssistantProfileRateLimit(userId, role);
  assertAssistantSessionRateLimit(userId, conversationId);
  assertAiRequestRateLimit(userId);
  await enforceAiLimits(userId);
}
