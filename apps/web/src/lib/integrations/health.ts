import type { IntegrationHealthItem, IntegrationHealthResponse } from "@/lib/integrations/types";
import {
  INTEGRATION_DEFINITIONS,
  resolveConfiguredVars,
  resolveMissingVars,
} from "@/lib/integrations/definitions";
import { getRecentIntegrationLogs, writeIntegrationLog } from "@/lib/integrations/log";
import { isProduction } from "@/lib/integrations/env-check";

export function buildIntegrationHealth(env = process.env): IntegrationHealthItem[] {
  const checkedAt = new Date().toISOString();
  return INTEGRATION_DEFINITIONS.map((def) => ({
    name: def.name,
    provider: def.provider,
    category: def.category,
    status: def.resolveStatus(env),
    requiredEnvVars: def.requiredEnvVars,
    configuredEnvVars: resolveConfiguredVars(def, env),
    missingEnvVars: resolveMissingVars(def, env),
    lastCheckedAt: checkedAt,
    canRunInProduction: def.canRunInProduction,
    canRunInDevelopment: def.canRunInDevelopment,
    message: def.resolveMessage(env),
    recommendedAction: def.recommendedAction,
  }));
}

export async function getIntegrationHealthReport(env = process.env): Promise<IntegrationHealthResponse> {
  const integrations = buildIntegrationHealth(env);
  const recentLogs = await getRecentIntegrationLogs(15);

  void writeIntegrationLog({
    integrationName: "platform",
    provider: "EcoPet",
    action: "health_check",
    status: "OK",
    metadata: {
      environment: env.NODE_ENV ?? "development",
      activeCount: integrations.filter((i) => i.status === "ACTIVE").length,
      notConfiguredCount: integrations.filter((i) => i.status === "NOT_CONFIGURED").length,
    },
  });

  return {
    environment: isProduction(env) ? "production" : "development",
    checkedAt: new Date().toISOString(),
    integrations,
    recentLogs: recentLogs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
