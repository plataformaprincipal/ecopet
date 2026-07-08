import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import {
  ADMIN_INTEGRATION_CATALOG,
  EMPTY_INTEGRATIONS_STORE,
  integrationEnvironment,
  testIntegrationConnection,
  type IntegrationsStore,
} from "@/lib/integrations/erp-integration-catalog";

const mutationSchema = z.object({
  action: z.enum(["test", "toggle"]),
  entity: z.string().min(1),
  id: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

async function loadAdminIntegrationsStore(): Promise<IntegrationsStore> {
  const session = await prisma.aiSession.findFirst({
    where: { type: "admin:erp:integracoes:platform" },
    orderBy: { updatedAt: "desc" },
  });
  if (!session?.messages) return { ...EMPTY_INTEGRATIONS_STORE };
  return { ...EMPTY_INTEGRATIONS_STORE, ...(session.messages as object) } as IntegrationsStore;
}

async function saveAdminIntegrationsStore(store: IntegrationsStore) {
  const type = "admin:erp:integracoes:platform";
  const existing = await prisma.aiSession.findFirst({ where: { type }, orderBy: { updatedAt: "desc" } });
  const data = JSON.parse(JSON.stringify(store));
  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages: data } });
  } else {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.aiSession.create({
      data: { userId: admin?.id ?? "platform", type, messages: data },
    });
  }
}

export async function mutateAdminErpModule(actorId: string, module: string, body: unknown) {
  if (module !== "integracoes") {
    return { ok: false as const, status: 400, message: "Módulo não suporta mutações." };
  }

  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const integrationId = parsed.data.id ?? parsed.data.entity;

  if (parsed.data.action === "test") {
    const result = testIntegrationConnection(integrationId, ADMIN_INTEGRATION_CATALOG);
    const store = await loadAdminIntegrationsStore();
    const log = {
      id: `log-${Date.now()}`,
      integrationId,
      action: "test",
      status: result.ok ? "ok" : "erro",
      message: result.message,
      at: new Date().toISOString(),
    };
    store.logs = [...store.logs, log].slice(-100);
    await saveAdminIntegrationsStore(store);
    await writeAuditLog({
      actorId,
      action: "VIEW",
      module: "admin-erp:integracoes",
      resource: "integration_test",
      resourceId: integrationId,
      entityAfter: log,
      observation: `Teste integração: ${integrationId} — ${result.message}`,
    });
    if (!result.ok) return { ok: false as const, status: 503, message: result.message, data: result };
    return { ok: true as const, data: result };
  }

  if (parsed.data.action === "toggle") {
    const def = ADMIN_INTEGRATION_CATALOG.find((c) => c.id === integrationId);
    if (!def) return { ok: false as const, status: 404, message: "Integração não encontrada." };
    if (!def.check()) {
      return {
        ok: false as const,
        status: 503,
        message: `Provedor não configurado. Variáveis: ${def.envKeys.join(", ") || "N/A"}`,
      };
    }
    const store = await loadAdminIntegrationsStore();
    const prev = store.connections[integrationId]?.enabled ?? true;
    const enabled = parsed.data.payload?.enabled !== undefined ? Boolean(parsed.data.payload.enabled) : !prev;
    store.connections[integrationId] = {
      ...store.connections[integrationId],
      enabled,
      environment: integrationEnvironment(),
      lastSync: enabled ? new Date().toISOString() : store.connections[integrationId]?.lastSync,
    };
    await saveAdminIntegrationsStore(store);
    await writeAuditLog({
      actorId,
      action: "UPDATE",
      module: "admin-erp:integracoes",
      resource: "integration_toggle",
      resourceId: integrationId,
      entityBefore: { enabled: prev },
      entityAfter: { enabled },
      observation: `Integração ${integrationId} ${enabled ? "ativada" : "desativada"}`,
    });
    return { ok: true as const, data: { integrationId, enabled } };
  }

  return { ok: false as const, status: 400, message: "Ação inválida." };
}
