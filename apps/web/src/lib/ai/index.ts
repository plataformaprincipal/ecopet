import "server-only";

import "@/lib/ai/agents";
import "@/lib/ai/prompts/registry";
import "@/lib/ai/tools/registry";
import "@/lib/ai/bootstrap-openai";

export type * from "@/lib/ai/types";
export { AI_ERROR_CODES, AI_PROVIDER_NOT_CONFIGURED_MESSAGE, AiProviderNotConfiguredError } from "@/lib/ai/errors";
export { runOrchestrator } from "@/lib/ai/orchestrator";
export { runEcoPetAI } from "@/lib/ai/ai-orchestrator";
export type { RunEcoPetAIInput, RunEcoPetAIResult } from "@/lib/ai/ai-orchestrator";
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
export { moderateContent } from "@/lib/ai/ai-moderation";
export { listTools, listToolsForAgent, executeTool } from "@/lib/ai/tools/registry";
export { executeInternalTool } from "@/lib/ai/ai-tools";
export { bootstrapAiPlatform } from "@/lib/ai/db/bootstrap";
export { aiProviderNotConfiguredResponse, mapAiErrorToResponse } from "@/lib/ai/api-helper";
export { AI_CONFIG, AI_SAFETY_DISCLAIMER, normalizeLocale } from "@/lib/ai/ai-config";
export { getOpenAIClient } from "@/lib/ai/openai-client";
export {
  getAiFoundationStatus,
  runAiFoundationHealth,
  runAiFoundationDiagnostics,
  runAiFoundationSmokeTest,
  maskSecretPreview,
} from "@/lib/ai/foundation";
export { withRetry } from "@/lib/ai/utils/retry";
export { sanitizeAiUserText, sanitizeAiMessages } from "@/lib/ai/utils/sanitize-input";
export { buildPrompt } from "@/lib/ai/utils/prompt-builder";
export { parseAiTextResponse, extractJsonBlock } from "@/lib/ai/utils/response-parser";
export { createEmbeddings, semanticSearch, ingestKnowledgeDocument } from "@/lib/ai/ai-embeddings";
export { generateProductRecommendations } from "@/lib/ai/ai-recommendations";
export { recordAiUsage, getDailyUsage, getAdminUsageStats } from "@/lib/ai/ai-usage";
export { writeAiAuditLog } from "@/lib/ai/ai-audit";
export { enforceAiLimits } from "@/lib/ai/ai-rate-limit";
export {
  streamAssistantChat,
  listAssistantConversations,
  patchAssistantConversation,
  getAssistantAnalyticsSummary,
  resolveAssistantPersona,
  buildAssistantSystemPrompt,
} from "@/lib/ai/assistant";
export {
  buildBusinessContext,
  listBusinessTools,
  executeBusinessTool,
  getSmartSuggestions,
  getBusinessAiDiagnostics,
  listFunctionCallingSchemas,
  FUNCTION_CALLING_READY,
} from "@/lib/ai/modules";
export {
  getEnterpriseDiagnostics,
  getEnterpriseCostDashboard,
  runPromptFirewall,
  enterpriseGenerate,
  enterpriseStream,
  runFunctionCallingLoop,
} from "@/lib/ai/enterprise";
export { getExecutiveAiDashboard } from "@/lib/ai/enterprise/executive-dashboard";
export { evaluateAiProductionReadiness } from "@/lib/ai/enterprise/production-readiness";
export { trackAiMetric, getTelemetrySink, MONITORING_INTEGRATIONS_READY } from "@/lib/ai/enterprise/monitoring";
export {
  isAiFlagEnabled,
  listAiFeatureFlags,
  resolveEcoPetAgent,
  processAutomationEvent,
  runPredictionsForUser,
  searchMarketplaceByNaturalLanguage,
  runExploreByMessage,
  buildMyPetAiSummary,
  getOperationalAiDiagnostics,
} from "@/lib/ai/operational";

