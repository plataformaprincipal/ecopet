import "server-only";

export {
  isAiFlagEnabled,
  assertAiFlag,
  listAiFeatureFlags,
  type AiFeatureFlag,
} from "./feature-flags";

export {
  resolveEcoPetAgent,
  agentAllowsSensitiveAction,
  type EcoPetAgentId,
  type AgentPlan,
} from "./agent-orchestrator";

export {
  AUTOMATION_RULES,
  listAutomationRules,
  getAutomationRule,
  listRulesForEvent,
  type AutomationEventType,
  type AutomationRule,
} from "./automations/registry";

export {
  processAutomationEvent,
  runAutomationRuleById,
  listRecentAutomationJobs,
  type AutomationEventPayload,
  type AutomationRunResult,
} from "./automations/executor";

export {
  predictClientReorder,
  predictPartnerLowStock,
  persistPrediction,
  runPredictionsForUser,
  type ExplainablePrediction,
  type PredictionKind,
} from "./predictions/engine";

export { parseMarketplaceNaturalLanguage, type MarketplaceNlPlan } from "./marketplace/nl-search";
export { searchMarketplaceByNaturalLanguage } from "./marketplace/search";

export { parseExploreIntent, type ExplorePlan, type ExploreTarget } from "./explore/intent";
export { runExploreByMessage } from "./explore/nl-explore";
export { buildMyPetAiSummary, type MyPetAiSummary } from "./mypet/safe-summary";

export async function getOperationalAiDiagnostics() {
  const { listAiFeatureFlags } = await import("./feature-flags");
  const { listAutomationRules } = await import("./automations/registry");
  return {
    flags: listAiFeatureFlags(),
    automationRules: listAutomationRules().map((r) => ({
      id: r.id,
      event: r.event,
      risk: r.risk,
      channels: r.channels,
    })),
    modules: [
      "orchestrator",
      "automations",
      "predictions",
      "marketplace_nl",
      "explore_nl",
      "mypet_safe",
    ],
  };
}
