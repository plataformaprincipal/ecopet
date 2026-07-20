import "server-only";

import { AI_CONFIG } from "@/lib/ai/ai-config";
import { runAiFoundationHealth } from "@/lib/ai/foundation";
import { FUNCTION_CALLING_READY } from "@/lib/ai/modules/function-calling";
import { getToolCatalogSnapshot } from "@/lib/ai/modules/tool-registry";
import { listEnterpriseModelStrategies } from "./model-strategy";
import { getEnterpriseCostDashboard } from "./cost-management";
import { getEnterpriseObservability } from "./observability";
import { getAiCache } from "@/lib/ai/modules/cache";
import { getEnterpriseJobQueue } from "./jobs-adapter";

export async function getEnterpriseDiagnostics() {
  const [health, costs, obs] = await Promise.all([
    runAiFoundationHealth(),
    getEnterpriseCostDashboard(),
    getEnterpriseObservability(),
  ]);

  return {
    health,
    configured: AI_CONFIG.isConfigured,
    responsesApi: {
      preferred: true,
      streamPreferred: true,
      chatCompletionsFallback: true,
    },
    functionCalling: {
      ...FUNCTION_CALLING_READY,
      openAiToolLoop: true,
      toolsRegistered: getToolCatalogSnapshot().length,
    },
    models: listEnterpriseModelStrategies(),
    security: {
      promptFirewall: true,
      sensitiveSanitize: true,
      securityEventsTable: true,
    },
    files: {
      uploadCloudinary: true,
      ocr: false,
      vision: false,
      virusScan: "prepared_skipped",
    },
    cache: { backend: "memory", redisReady: true, probe: Boolean(getAiCache()) },
    jobs: { backend: getEnterpriseJobQueue().backend, queuesImplemented: false },
    costs,
    observability: obs,
    generatedAt: new Date().toISOString(),
  };
}
