import type { AiModelConfig, AiModelProvider } from "@/lib/ai/types";

export const AI_MODEL_REGISTRY: Record<string, AiModelConfig> = {
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    label: "GPT-4o Mini",
    description: "Modelo econômico OpenAI.",
    version: "2024-07",
    contextWindow: 128000,
    streaming: true,
    vision: true,
    functionCalling: true,
    maxTokens: 4096,
    inputCostPer1kUsd: 0.00015,
    outputCostPer1kUsd: 0.0006,
    enabled: true,
    status: "INACTIVE",
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    label: "GPT-4o",
    description: "Modelo avançado OpenAI.",
    version: "2024-11",
    contextWindow: 128000,
    streaming: true,
    vision: true,
    functionCalling: true,
    maxTokens: 8192,
    inputCostPer1kUsd: 0.0025,
    outputCostPer1kUsd: 0.01,
    enabled: true,
    status: "INACTIVE",
  },
  "claude-sonnet": {
    id: "claude-sonnet",
    provider: "anthropic",
    label: "Claude Sonnet",
    description: "Modelo Anthropic — integração futura.",
    version: "4.0",
    contextWindow: 200000,
    streaming: true,
    vision: true,
    functionCalling: true,
    maxTokens: 8192,
    inputCostPer1kUsd: 0.003,
    outputCostPer1kUsd: 0.015,
    enabled: false,
    status: "INACTIVE",
  },
  "gemini-pro": {
    id: "gemini-pro",
    provider: "google",
    label: "Gemini Pro",
    description: "Modelo Google — integração futura.",
    version: "2.0",
    contextWindow: 1000000,
    streaming: true,
    vision: true,
    functionCalling: true,
    maxTokens: 8192,
    inputCostPer1kUsd: 0.00125,
    outputCostPer1kUsd: 0.005,
    enabled: false,
    status: "INACTIVE",
  },
};

export function getModelFromRegistry(modelId: string): AiModelConfig | null {
  return AI_MODEL_REGISTRY[modelId] ?? null;
}

export function listModelsFromRegistry(filter?: { provider?: AiModelProvider }) {
  return Object.values(AI_MODEL_REGISTRY).filter((m) => {
    if (filter?.provider && m.provider !== filter.provider) return false;
    return true;
  });
}

export function getDefaultModelId(): string {
  return "gpt-4o-mini";
}
