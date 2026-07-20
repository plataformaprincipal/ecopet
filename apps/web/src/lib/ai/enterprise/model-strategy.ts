import { AI_CONFIG } from "@/lib/ai/ai-config";
import { AI_MODEL_REGISTRY } from "@/lib/ai/models/registry";

export type ModelPurpose = "chat" | "tools" | "embed" | "moderate" | "fallback";

/**
 * Strategy Pattern — troca de modelo sem alterar callers.
 */
export function resolveEnterpriseModel(purpose: ModelPurpose = "chat"): string {
  const envOverride =
    purpose === "tools"
      ? process.env.OPENAI_TOOLS_MODEL?.trim()
      : purpose === "fallback"
        ? process.env.OPENAI_FALLBACK_MODEL?.trim()
        : purpose === "embed"
          ? process.env.OPENAI_EMBEDDING_MODEL?.trim()
          : undefined;

  if (envOverride) return envOverride;

  if (purpose === "embed") return AI_CONFIG.embeddingModel;
  if (purpose === "fallback") {
    return process.env.OPENAI_FALLBACK_MODEL?.trim() || "gpt-4o-mini";
  }

  const preferred = AI_CONFIG.model;
  const entry = AI_MODEL_REGISTRY[preferred];
  if (entry?.enabled) return preferred;

  const firstEnabled = Object.values(AI_MODEL_REGISTRY).find((m) => m.enabled && m.provider === "openai");
  return firstEnabled?.id ?? "gpt-4o-mini";
}

export function listEnterpriseModelStrategies() {
  return {
    chat: resolveEnterpriseModel("chat"),
    tools: resolveEnterpriseModel("tools"),
    embed: resolveEnterpriseModel("embed"),
    fallback: resolveEnterpriseModel("fallback"),
    registry: Object.values(AI_MODEL_REGISTRY)
      .filter((m) => m.provider === "openai")
      .map((m) => ({
        id: m.id,
        enabled: m.enabled,
        functionCalling: m.functionCalling,
        streaming: m.streaming,
      })),
  };
}
