import type { AiAgentDefinition, AiAgentId } from "@/lib/ai/types";
import { getDefaultModelId, getModelFromRegistry } from "@/lib/ai/models/registry";

const agents = new Map<AiAgentId, AiAgentDefinition>();

export function registerAgent(definition: AiAgentDefinition) {
  agents.set(definition.id, definition);
}

export function getAgent(agentId: AiAgentId): AiAgentDefinition | null {
  return agents.get(agentId) ?? null;
}

export function listAgents(): AiAgentDefinition[] {
  return [...agents.values()];
}

export function resolveAgentModel(agentId: AiAgentId) {
  const agent = getAgent(agentId);
  const modelId = agent?.defaultModelId ?? getDefaultModelId();
  return getModelFromRegistry(modelId) ?? getModelFromRegistry(getDefaultModelId())!;
}

// Re-export model helpers para compatibilidade
export { getModelFromRegistry as getModel, listModelsFromRegistry as listModels, getDefaultModelId } from "@/lib/ai/models/registry";
