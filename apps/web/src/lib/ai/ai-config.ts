import type { AiLocale } from "@/lib/ai/ai-disclaimer";
import { AI_SAFETY_DISCLAIMER, normalizeLocale } from "@/lib/ai/ai-disclaimer";

export type { AiLocale };
export { AI_SAFETY_DISCLAIMER, normalizeLocale };

/**
 * Configuração central da IA EcoPet — somente server-side.
 * Nunca expor estes valores ao frontend.
 */

function num(env: string | undefined, fallback: number): number {
  const n = Number(env);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type AiModule =
  | "ecopet-ai"
  | "profile"
  | "pets"
  | "marketplace"
  | "products"
  | "services"
  | "appointments"
  | "orders"
  | "cart"
  | "partner"
  | "ong"
  | "social"
  | "messages"
  | "notifications"
  | "search"
  | "support"
  | "admin"
  | "moderation"
  | "reports"
  | "recommendations"
  | "accessibility"
  | "translation"
  | "automation";

export const AI_CONFIG = {
  get apiKey(): string | undefined {
    const key = process.env.OPENAI_API_KEY?.trim();
    return key || undefined;
  },
  get model(): string {
    return process.env.OPENAI_MODEL?.trim() || process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  },
  get embeddingModel(): string {
    return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  },
  get moderationModel(): string {
    return process.env.OPENAI_MODERATION_MODEL?.trim() || "omni-moderation-latest";
  },
  get maxOutputTokens(): number {
    return num(process.env.OPENAI_MAX_OUTPUT_TOKENS, 1024);
  },
  get requestTimeoutMs(): number {
    return num(process.env.OPENAI_REQUEST_TIMEOUT_MS, 30_000);
  },
  get dailyUserLimit(): number {
    return num(process.env.OPENAI_DAILY_USER_LIMIT, 50);
  },
  get monthlyBudgetCents(): number {
    return num(process.env.OPENAI_MONTHLY_BUDGET_CENTS, 5_000);
  },
  get maxInputChars(): number {
    return 8_000;
  },
  get maxHistoryMessages(): number {
    return 6;
  },
  get globallyEnabled(): boolean {
    return process.env.AI_ENABLED !== "false" && process.env.OPENAI_PAUSED !== "1";
  },
  get isConfigured(): boolean {
    return Boolean(this.apiKey) && this.globallyEnabled;
  },
} as const;

export const AI_COST_PER_1K: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "text-embedding-3-small": { input: 0.00002, output: 0 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rates = AI_COST_PER_1K[model] ?? AI_COST_PER_1K["gpt-4o-mini"];
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}
