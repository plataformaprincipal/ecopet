import "@/lib/ai/agents";
import "@/lib/ai/prompts/registry";
import "@/lib/ai/tools/registry";

export type * from "@/lib/ai/types";
export { AI_ERROR_CODES, AI_PROVIDER_NOT_CONFIGURED_MESSAGE, AiProviderNotConfiguredError } from "@/lib/ai/errors";
export { runOrchestrator } from "@/lib/ai/orchestrator";
export type { AIProvider } from "@/lib/ai/provider";
export {
  getAIProvider,
  registerAIProvider,
  isAIProviderConfigured,
  createAiCompletion,
  assertOpenAiConfigured,
  assertProviderConfigured,
  getAiStatus,
  isProviderReady,
} from "@/lib/ai/provider";
export {
  registerAgent,
  getAgent,
  listAgents,
  getModel,
  listModels,
  resolveAgentModel,
} from "@/lib/ai/registry";
export { AI_MODEL_REGISTRY } from "@/lib/ai/models/registry";
export { listAgentsForRole, canAccessAgent, resolveAgentForRequest } from "@/lib/ai/permissions";
export { getPrompt, listPrompts, getLatestPrompt } from "@/lib/ai/prompts/registry";
export {
  loadMemory,
  saveMemory,
  listUserMemorySessions,
  createConversation,
  appendConversationMessage,
} from "@/lib/ai/memory";
export { writeAiLog, listAiLogs, getAiLogStats } from "@/lib/ai/logger";
export { writeAiPlatformLog, listTokenUsage, listConversations, listFeedbacks } from "@/lib/ai/logs/service";
export { AI_INTEGRATION_POINTS, getIntegrationPoint } from "@/lib/ai/integration-points";
export { moderateInput, moderateOutput } from "@/lib/ai/moderation";
export { listTools, listToolsForAgent, executeTool } from "@/lib/ai/tools/registry";
export { bootstrapAiPlatform } from "@/lib/ai/db/bootstrap";
export { aiProviderNotConfiguredResponse, mapAiErrorToResponse } from "@/lib/ai/api-helper";
