import { prisma } from "@/lib/prisma";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { AI_RUNTIME_ERROR_CODES, AiRuntimeError } from "@/lib/ai/ai-errors";
import { checkAuthRateLimit } from "@/lib/rate-limit";

type CircuitState = { failures: number; openUntil: number };

const circuit: CircuitState = { failures: 0, openUntil: 0 };
const FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 60_000;

export function isCircuitOpen(): boolean {
  return Date.now() < circuit.openUntil;
}

export function recordAiSuccess() {
  circuit.failures = 0;
  circuit.openUntil = 0;
}

export function recordAiFailure() {
  circuit.failures += 1;
  if (circuit.failures >= FAILURE_THRESHOLD) {
    circuit.openUntil = Date.now() + CIRCUIT_OPEN_MS;
    circuit.failures = 0;
  }
}

/** Rate limit por usuário (sempre ativo para IA). */
export function assertAiRequestRateLimit(userId: string): void {
  if (isCircuitOpen()) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.UNAVAILABLE,
      "Serviço de IA temporariamente indisponível.",
      503
    );
  }
  const ok = checkAuthRateLimit(`ai:req:${userId}`, 30, 60_000);
  if (!ok) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      "Muitas requisições. Aguarde um momento.",
      429
    );
  }
}

export async function assertDailyUserLimit(userId: string): Promise<void> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const count = await prisma.aIUsage.count({
    where: { userId, createdAt: { gte: start }, success: true },
  }).catch(async () => {
    // fallback se migration ainda não aplicada
    return prisma.aITokenUsage.count({
      where: { userId, createdAt: { gte: start } },
    });
  });
  if (count >= AI_CONFIG.dailyUserLimit) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.RATE_LIMIT,
      "Limite diário de IA atingido.",
      429
    );
  }
}

export async function assertMonthlyBudget(): Promise<void> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const agg = await prisma.aIUsage
    .aggregate({
      where: { createdAt: { gte: start }, success: true },
      _sum: { estimatedCost: true },
    })
    .catch(async () => {
      const legacy = await prisma.aITokenUsage.aggregate({
        where: { createdAt: { gte: start } },
        _sum: { estimatedCost: true },
      });
      return { _sum: { estimatedCost: legacy._sum.estimatedCost } };
    });

  const usd = agg._sum.estimatedCost ?? 0;
  const cents = Math.round(usd * 100);
  if (cents >= AI_CONFIG.monthlyBudgetCents) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.BUDGET_EXCEEDED,
      "Orçamento mensal de IA excedido.",
      503
    );
  }
}

/** Limites para endpoints operacionais que não chamam OpenAI (NL filters, previsões heurísticas). */
export function enforceOperationalAiLimits(userId: string): void {
  if (!AI_CONFIG.globallyEnabled) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.GLOBAL_PAUSED,
      "IA pausada pela administração.",
      503
    );
  }
  assertAiRequestRateLimit(userId);
}

export async function enforceAiLimits(userId: string): Promise<void> {
  if (!AI_CONFIG.globallyEnabled) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.GLOBAL_PAUSED,
      "IA pausada pela administração.",
      503
    );
  }
  if (!AI_CONFIG.isConfigured) {
    throw new AiRuntimeError(
      AI_RUNTIME_ERROR_CODES.NOT_CONFIGURED,
      "Os recursos de inteligência artificial ainda não estão disponíveis neste ambiente.",
      503
    );
  }
  assertAiRequestRateLimit(userId);
  await assertDailyUserLimit(userId);
  await assertMonthlyBudget();
}
