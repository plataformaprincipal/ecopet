import costTable from "./openai-cost-table.json";

export type OpenAiCostRates = {
  input: number;
  cachedInput: number;
  output: number;
};

const TABLE = costTable as Record<string, OpenAiCostRates>;

export function getOpenAiCostRates(model: string): OpenAiCostRates {
  return TABLE[model] ?? TABLE.default;
}

export function estimateOpenAiCostUsd(params: {
  model: string;
  inputTokens: number;
  cachedInputTokens?: number;
  outputTokens: number;
}): number {
  const rates = getOpenAiCostRates(params.model);
  const cached = Math.max(0, params.cachedInputTokens ?? 0);
  const uncached = Math.max(0, params.inputTokens - cached);
  return (uncached / 1000) * rates.input + (cached / 1000) * rates.cachedInput + (params.outputTokens / 1000) * rates.output;
}

export const AI_COMMERCE_MODELS = {
  get default(): string {
    return process.env.AI_MODEL_DEFAULT?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  },
  get complex(): string {
    return process.env.AI_MODEL_COMPLEX?.trim() || process.env.AI_MODEL_DEFAULT?.trim() || "gpt-4o-mini";
  },
  get vision(): string {
    return process.env.AI_MODEL_VISION?.trim() || process.env.AI_MODEL_DEFAULT?.trim() || "gpt-4o-mini";
  },
  get document(): string {
    return process.env.AI_MODEL_DOCUMENT?.trim() || process.env.AI_MODEL_COMPLEX?.trim() || this.complex;
  },
  get image(): string {
    return process.env.AI_IMAGE_MODEL?.trim() || "gpt-image-1";
  },
} as const;

export const AI_COMMERCE_LIMITS = {
  maxOutputTokens: Number(process.env.AI_COMMERCE_MAX_OUTPUT_TOKENS) || 1800,
  maxImages: 6,
  maxFiles: 4,
  maxFileBytes: 8 * 1024 * 1024,
  maxTotalBytes: 20 * 1024 * 1024,
  timeoutMs: Number(process.env.AI_COMMERCE_TIMEOUT_MS) || 60_000,
  maxRetries: 2,
} as const;
