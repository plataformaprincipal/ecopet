import { z } from "zod";
import type { NgoErpModuleId } from "./types";
import { loadNgoErpStore, saveNgoErpStore, auditNgoErp } from "./store";
import { assertNgoErpPermission } from "./access";
import {
  EMPTY_INTEGRATIONS_STORE,
  integrationEnvironment,
  NGO_INTEGRATION_CATALOG,
  testIntegrationConnection,
  type IntegrationsStore,
} from "@/lib/integrations/erp-integration-catalog";
import { NGO_AUTOMATION_WORKFLOWS } from "./ngo-platform-service";

const mutationSchema = z.object({
  action: z.enum(["create", "update", "delete", "test", "toggle"]),
  entity: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  id: z.string().optional(),
});

const ENTITY_STORE_KEY: Record<string, Record<string, string>> = {
  doacoes: { donation: "donations", recurring: "recurring" },
  voluntariado: {
    volunteer: "volunteers",
    shift: "shifts",
    availability: "availability",
    training: "trainings",
    document: "documents",
    attendance: "attendance",
    evaluation: "evaluations",
  },
  financeiro: {
    revenue: "revenues",
    expense: "expenses",
    payable: "payables",
    receivable: "receivables",
    receipt: "receipts",
    voucher: "vouchers",
    report: "reports",
    accountability: "accountability",
    forecast: "forecasts",
    budget: "budgets",
  },
  administrativo: {
    task: "tasks",
    document: "documents",
    process: "processes",
    communication: "communications",
    calendar_event: "calendar",
    responsible: "responsibles",
    checklist: "checklists",
    internal_request: "internalRequests",
  },
  "espaco-fisico": {
    shelter: "shelters",
    unit: "shelters",
    bay: "bays",
    room: "rooms",
    quarantine: "quarantine",
    feed_stock: "feedStock",
    med_stock: "medStock",
    maintenance: "maintenance",
    cleaning: "cleaning",
    security_log: "security",
    temperature: "temperature",
    incident: "incidents",
  },
  parcerias: {
    partner: "partners",
    contact: "contacts",
    contract: "contracts",
  },
  marketing: {
    campaign: "campaigns",
    post: "posts",
    email: "emails",
    push: "push",
    whatsapp: "whatsapp",
    event: "events",
    seo: "seo",
    creative: "creatives",
    metric: "metrics",
  },
  automacoes: { reminder: "reminders", run: "runs" },
  integracoes: { config: "configs" },
  veterinario: { surgery: "surgeries", hospitalization: "hospitalizations", prescription: "prescriptions" },
};

const AUDIT_ACTION = {
  create: "CREATE" as const,
  update: "UPDATE" as const,
  delete: "DELETE" as const,
  test: "VIEW" as const,
  toggle: "UPDATE" as const,
};

const SENSITIVE_MODULES = new Set([
  "adocoes",
  "doacoes",
  "financeiro",
  "parcerias",
  "voluntariado",
  "administrativo",
  "integracoes",
  "ia",
  "configuracoes",
]);

function resolvePermAction(action: string) {
  if (action === "create") return "create" as const;
  if (action === "update" || action === "toggle") return "edit" as const;
  if (action === "delete") return "delete" as const;
  return "configure" as const;
}

export async function mutateNgoErpModule(
  ongId: string,
  actorId: string,
  module: NgoErpModuleId,
  body: unknown
) {
  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const permAction = resolvePermAction(parsed.data.action);
  const { allowed } = await assertNgoErpPermission(ongId, actorId, module, permAction);
  if (!allowed) {
    return { ok: false as const, status: 403, message: "Sem permissão para esta ação." };
  }

  if (module === "integracoes" && parsed.data.action === "test") {
    const integrationId = parsed.data.id ?? parsed.data.entity;
    const result = testIntegrationConnection(integrationId, NGO_INTEGRATION_CATALOG);
    const store = await loadNgoErpStore<IntegrationsStore>(ongId, "integracoes", EMPTY_INTEGRATIONS_STORE);
    const log = {
      id: `log-${Date.now()}`,
      integrationId,
      action: "test",
      status: result.ok ? "ok" : "erro",
      message: result.message,
      at: new Date().toISOString(),
    };
    store.logs = [...store.logs, log].slice(-100);
    if (store.connections[integrationId]) {
      store.connections[integrationId].recentError = result.ok ? undefined : result.message;
      if (result.ok) store.connections[integrationId].lastSync = log.at;
    }
    await saveNgoErpStore(ongId, "integracoes", store);
    await auditNgoErp({
      actorId,
      ongId,
      module: "integracoes",
      resource: "integration_test",
      action: "VIEW",
      resourceId: integrationId,
      entityAfter: log,
      observation: `Teste de conexão: ${integrationId} — ${result.message}`,
    });
    if (!result.ok) {
      return { ok: false as const, status: 503, message: result.message, data: result };
    }
    return { ok: true as const, data: result };
  }

  if (module === "integracoes" && parsed.data.action === "toggle") {
    const integrationId = parsed.data.id ?? parsed.data.entity;
    const def = NGO_INTEGRATION_CATALOG.find((c) => c.id === integrationId);
    if (!def) return { ok: false as const, status: 404, message: "Integração não encontrada." };
    if (!def.check()) {
      return {
        ok: false as const,
        status: 503,
        message: `Provedor não configurado. Configure as variáveis: ${def.envKeys.join(", ")}`,
      };
    }
    const store = await loadNgoErpStore<IntegrationsStore>(ongId, "integracoes", EMPTY_INTEGRATIONS_STORE);
    const prev = store.connections[integrationId]?.enabled ?? true;
    const enabled = parsed.data.payload?.enabled !== undefined ? Boolean(parsed.data.payload.enabled) : !prev;
    store.connections[integrationId] = {
      ...store.connections[integrationId],
      enabled,
      environment: integrationEnvironment(),
      lastSync: enabled ? new Date().toISOString() : store.connections[integrationId]?.lastSync,
    };
    await saveNgoErpStore(ongId, "integracoes", store);
    await auditNgoErp({
      actorId,
      ongId,
      module: "integracoes",
      resource: "integration_toggle",
      action: "UPDATE",
      resourceId: integrationId,
      entityBefore: { enabled: prev },
      entityAfter: { enabled },
      observation: `Integração ${integrationId} ${enabled ? "ativada" : "desativada"}`,
    });
    return { ok: true as const, data: { integrationId, enabled } };
  }

  if (module === "automacoes" && parsed.data.action === "toggle" && parsed.data.entity === "workflow") {
    const workflowId = String(parsed.data.id ?? parsed.data.payload?.workflowId ?? "");
    if (!NGO_AUTOMATION_WORKFLOWS.some((w) => w.id === workflowId)) {
      return { ok: false as const, status: 404, message: "Workflow não encontrado." };
    }
    const store = await loadNgoErpStore(ongId, "automacoes", {
      reminders: [] as Array<Record<string, unknown>>,
      workflowStates: {} as Record<string, { enabled: boolean; lastRun?: string }>,
      runs: [] as Array<Record<string, unknown>>,
    });
    const prev = store.workflowStates[workflowId]?.enabled ?? true;
    const enabled = parsed.data.payload?.enabled !== undefined ? Boolean(parsed.data.payload.enabled) : !prev;
    store.workflowStates[workflowId] = { ...store.workflowStates[workflowId], enabled };
    await saveNgoErpStore(ongId, "automacoes", store);
    await auditNgoErp({
      actorId,
      ongId,
      module: "automacoes",
      resource: "workflow",
      action: "UPDATE",
      resourceId: workflowId,
      entityBefore: { enabled: prev },
      entityAfter: { enabled },
      observation: `Workflow ${workflowId} ${enabled ? "ativado" : "desativado"}`,
    });
    return { ok: true as const, data: { workflowId, enabled } };
  }

  const entityMap = ENTITY_STORE_KEY[module];
  const storeKey = entityMap?.[parsed.data.entity];
  if (!storeKey) {
    return { ok: false as const, status: 400, message: "Entidade não suportada neste módulo." };
  }

  if (parsed.data.action === "test" || parsed.data.action === "toggle") {
    return { ok: false as const, status: 400, message: "Ação não suportada para esta entidade." };
  }

  const store = await loadNgoErpStore<Record<string, unknown[]>>(ongId, module, {});
  const list = Array.isArray(store[storeKey]) ? [...store[storeKey]!] : [];
  let before: unknown;
  let after: unknown;

  if (parsed.data.action === "create") {
    const item = { id: `item-${Date.now()}`, ...parsed.data.payload, createdAt: new Date().toISOString() };
    list.push(item);
    after = item;
  } else if (parsed.data.action === "update" && parsed.data.id) {
    const idx = list.findIndex((i) => (i as { id?: string }).id === parsed.data.id);
    if (idx < 0) return { ok: false as const, status: 404, message: "Registro não encontrado." };
    before = list[idx];
    list[idx] = { ...(list[idx] as object), ...parsed.data.payload, updatedAt: new Date().toISOString() };
    after = list[idx];
  } else if (parsed.data.action === "delete" && parsed.data.id) {
    const idx = list.findIndex((i) => (i as { id?: string }).id === parsed.data.id);
    if (idx < 0) return { ok: false as const, status: 404, message: "Registro não encontrado." };
    before = list[idx];
    list.splice(idx, 1);
  } else {
    return { ok: false as const, status: 400, message: "Ação inválida ou id ausente." };
  }

  store[storeKey] = list;
  await saveNgoErpStore(ongId, module, store);
  await auditNgoErp({
    actorId,
    ongId,
    module,
    resource: parsed.data.entity,
    action: AUDIT_ACTION[parsed.data.action],
    resourceId: parsed.data.id,
    entityBefore: before,
    entityAfter: after,
    observation: `${parsed.data.action} em ${parsed.data.entity}${SENSITIVE_MODULES.has(module) ? " (sensível)" : ""}`,
  });

  return { ok: true as const, data: after ?? { deleted: parsed.data.id } };
}
