import type { IntegrationHealthItem } from "@/lib/integrations/types";
import { getIntegrationDefinition } from "@/lib/integrations/definitions";

export function getIntegrationStatus(name: string, env = process.env): IntegrationHealthItem | null {
  const def = getIntegrationDefinition(name);
  if (!def) return null;
  const checkedAt = new Date().toISOString();
  return {
    name: def.name,
    provider: def.provider,
    category: def.category,
    status: def.resolveStatus(env),
    requiredEnvVars: def.requiredEnvVars,
    configuredEnvVars: def.requiredEnvVars.filter((k) => !k.includes("/") && Boolean(env[k]?.trim())),
    missingEnvVars: def.requiredEnvVars.filter((k) => !k.includes("/") && !env[k]?.trim()),
    lastCheckedAt: checkedAt,
    canRunInProduction: def.canRunInProduction,
    canRunInDevelopment: def.canRunInDevelopment,
    message: def.resolveMessage(env),
    recommendedAction: def.recommendedAction,
  };
}

export { buildIntegrationHealth } from "@/lib/integrations/health";
