/**
 * Health leve de integrações (Phase 1).
 * Apenas presença de env — sem chamadas externas que exijam chaves.
 */

export { getIntegrationHealthReport, buildIntegrationHealth } from "./health";

import {
  getAllIntegrationStatuses,
  getIntegrationStatus,
  type IntegrationStatus,
} from "@/lib/integrations/integration-status";
import type { EnvSource } from "@/lib/integrations/integration-config";

export type ProviderEnvHealth = {
  provider: string;
  ok: boolean;
  status: IntegrationStatus["status"];
  missingVariables: string[];
  checkedAt: string;
};

export function checkProviderEnvHealth(
  providerId: string,
  source: EnvSource = process.env
): ProviderEnvHealth {
  const status = getIntegrationStatus(providerId, source);
  return {
    provider: status.provider,
    ok: status.available,
    status: status.status,
    missingVariables: status.missingVariables,
    checkedAt: status.lastCheckedAt ?? new Date().toISOString(),
  };
}

export function checkAllProvidersEnvHealth(source: EnvSource = process.env): {
  checkedAt: string;
  healthy: number;
  unhealthy: number;
  items: ProviderEnvHealth[];
} {
  const statuses = getAllIntegrationStatuses(source);
  const items = statuses.map((status) => ({
    provider: status.provider,
    ok: status.available,
    status: status.status,
    missingVariables: status.missingVariables,
    checkedAt: status.lastCheckedAt ?? new Date().toISOString(),
  }));
  return {
    checkedAt: new Date().toISOString(),
    healthy: items.filter((i) => i.ok).length,
    unhealthy: items.filter((i) => !i.ok).length,
    items,
  };
}
