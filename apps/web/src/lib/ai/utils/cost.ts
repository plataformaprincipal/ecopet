import type { AiCompletionUsage, AiModelConfig } from "@/lib/ai/types";

export function estimateCostUsd(model: AiModelConfig, usage: AiCompletionUsage): number {
  const input = (usage.promptTokens / 1000) * model.inputCostPer1kUsd;
  const output = (usage.completionTokens / 1000) * model.outputCostPer1kUsd;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}
