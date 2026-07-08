import {
  ADMIN_INTEGRATION_CATALOG,
  buildIntegrationRows,
  EMPTY_INTEGRATIONS_STORE,
  integrationEnvironment,
  maskEnvToken,
  type IntegrationsStore,
} from "./erp-integration-catalog";
import { getRecentIntegrationLogs } from "./log";
import { prisma } from "@/lib/prisma";

export type IntegrationStatusValue = "ACTIVE" | "INACTIVE" | "NOT_CONFIGURED" | "ERROR" | "DEGRADED";

export type GlobalIntegrationRecord = {
  id: string;
  name: string;
  category: string;
  status: IntegrationStatusValue;
  configured: boolean;
  environment: string;
  lastHealthCheck?: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  credentialsMasked: string;
  webhooksEnabled: boolean;
};

function mapStatus(row: Record<string, unknown>): IntegrationStatusValue {
  const s = String(row.status ?? "");
  if (s.includes("Não configurado")) return "NOT_CONFIGURED";
  if (s.includes("Erro") || row.erroRecente && row.erroRecente !== "—") return "ERROR";
  if (s.includes("Parcial")) return "DEGRADED";
  if (s.includes("Inativo")) return "INACTIVE";
  return "ACTIVE";
}

export async function listGlobalIntegrations(store?: IntegrationsStore): Promise<GlobalIntegrationRecord[]> {
  const dayAgo = new Date(Date.now() - 86400000);
  const logs = await getRecentIntegrationLogs(200);
  const rows = buildIntegrationRows(ADMIN_INTEGRATION_CATALOG, store ?? EMPTY_INTEGRATIONS_STORE);
  return rows.map((row) => {
    const id = String(row.id);
    const providerLogs = logs.filter((l) => l.integrationName === id || l.provider === id);
    const lastSuccess = providerLogs.find((l) => l.status === "success");
    const lastError = providerLogs.find((l) => l.status === "error" || l.status === "failed");
    return {
      id,
      name: String(row.integracao),
      category: String(row.categoria),
      status: mapStatus(row),
      configured: Boolean(row.configurado),
      environment: String(row.ambiente ?? integrationEnvironment()),
      lastHealthCheck: lastSuccess?.createdAt?.toISOString(),
      lastSuccessAt: lastSuccess?.createdAt?.toISOString(),
      lastErrorAt: lastError?.createdAt?.toISOString(),
      lastErrorMessage: lastError?.message ?? (row.erroRecente !== "—" ? String(row.erroRecente) : undefined),
      credentialsMasked: String(row.token ?? maskEnvToken(ADMIN_INTEGRATION_CATALOG.find((c) => c.id === id)?.envKeys ?? [])),
      webhooksEnabled: ADMIN_INTEGRATION_CATALOG.find((c) => c.id === id)?.supportsWebhook ?? false,
    };
  });
}

export async function getIntegrationHealthSummary() {
  const items = await listGlobalIntegrations();
  const failures24h = await prisma.platformIntegrationLog.count({
    where: { status: { in: ["error", "failed"] }, createdAt: { gte: new Date(Date.now() - 86400000) } },
  });
  return {
    active: items.filter((i) => i.status === "ACTIVE").length,
    notConfigured: items.filter((i) => i.status === "NOT_CONFIGURED").length,
    error: items.filter((i) => i.status === "ERROR" || i.status === "DEGRADED").length,
    failures24h,
    lastHealthCheck: items.find((i) => i.lastHealthCheck)?.lastHealthCheck ?? null,
    items,
  };
}
