import { z } from "zod";
import type { PartnerErpModuleId } from "./types";
import { loadPartnerErpStore, savePartnerErpStore, auditPartnerErp } from "./store";
import {
  defaultPartnerPermissionMatrix,
  type PartnerErpRole,
  type PartnerErpResource,
  type PartnerPermissionAction,
  type PartnerRoleAssignment,
  PARTNER_ERP_RESOURCES,
  PARTNER_PERMISSION_ACTIONS,
} from "./permissions";
import { assertPartnerErpPermission } from "./access";

const mutationSchema = z.object({
  action: z.enum(["create", "update", "delete", "assign_role"]),
  entity: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  id: z.string().optional(),
});

const ENTITY_STORE_KEY: Record<string, Record<string, string>> = {
  rh: {
    employee: "employees",
    department: "departments",
    role: "roles",
    vacation: "vacations",
    training: "trainings",
    evaluation: "evaluations",
    goal: "goals",
    document: "documents",
    access: "accesses",
  },
  juridico: { contract: "contracts" },
  administrativo: { task: "tasks", communication: "communications" },
  compras: { request: "requests", quote: "quotes" },
  fornecedores: { supplier: "suppliers" },
  infraestrutura: { unit: "units", room: "rooms", equipment: "equipment", maintenance: "maintenance" },
  equipamentos: {
    computer: "computers",
    printer: "printers",
    collector: "collectors",
    reader: "readers",
    machine: "machines",
    camera: "cameras",
  },
  automacoes: { reminder: "reminders" },
  ti: { user: "users", backup: "backups", integration: "integrations", api: "apis" },
  marketing: {
    campaign: "campaigns",
    email: "emails",
    push: "push",
    sms: "sms",
    seo: "seo",
    ad: "ads",
  },
  fidelidade: { coupon: "coupons", program: "programs", subscription: "subscriptions" },
  marketplace: { promotion: "promotions", coupon: "coupons", kit: "kits", combo: "combos" },
  veterinario: {
    surgery: "surgeries",
    hospitalization: "hospitalizations",
    prescription: "prescriptions",
  },
  loja: { queue: "queues", pdv: "pdvSessions", label: "labels" },
  integracoes: { config: "configs" },
  laboratorio: { test: "tests", homologation: "homologation", ab: "abTests" },
  parcerias: {
    ngo: "ngos",
    campaign: "campaigns",
    sponsored_animal: "sponsoredAnimals",
    donation: "donations",
    free_service: "freeServices",
    social_discount: "socialDiscounts",
    joint_event: "jointEvents",
    contract: "contracts",
    history_entry: "history",
  },
};

const AUDIT_ACTION = {
  create: "CREATE" as const,
  update: "UPDATE" as const,
  delete: "DELETE" as const,
  assign_role: "ASSIGN" as const,
};

export async function mutatePartnerErpModule(
  partnerId: string,
  actorId: string,
  module: PartnerErpModuleId,
  body: unknown
) {
  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, status: 400, message: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }

  const permAction =
    parsed.data.action === "create"
      ? "create"
      : parsed.data.action === "update"
        ? "edit"
        : parsed.data.action === "delete"
          ? "delete"
          : "configure";

  const { allowed } = await assertPartnerErpPermission(partnerId, actorId, module, permAction);
  if (!allowed) {
    return { ok: false as const, status: 403, message: "Sem permissão para esta ação." };
  }

  if (module === "permissoes" && parsed.data.action === "assign_role") {
    const role = parsed.data.payload?.role as PartnerErpRole | undefined;
    const userId = parsed.data.payload?.userId as string | undefined;
    const userName = parsed.data.payload?.userName as string | undefined;
    if (!role || !userId || !userName) {
      return { ok: false as const, status: 400, message: "role, userId e userName são obrigatórios." };
    }
    const store = await loadPartnerErpStore(partnerId, "permissoes", {
      matrix: defaultPartnerPermissionMatrix(),
      assignments: [] as PartnerRoleAssignment[],
    });
    const assignment: PartnerRoleAssignment = {
      id: `assign-${Date.now()}`,
      userId,
      userName,
      role,
      createdAt: new Date().toISOString(),
    };
    store.assignments = [...store.assignments.filter((a) => a.userId !== userId), assignment];
    await savePartnerErpStore(partnerId, "permissoes", store);
    await auditPartnerErp({
      actorId,
      partnerId,
      module: "permissoes",
      resource: "role_assignment",
      action: AUDIT_ACTION.assign_role,
      resourceId: assignment.id,
      entityAfter: assignment,
      observation: `Papel ${role} atribuído a ${userName}`,
    });
    return { ok: true as const, data: assignment };
  }

  if (module === "permissoes" && parsed.data.action === "update" && parsed.data.entity === "permission") {
    const { allowed: canConfigure } = await assertPartnerErpPermission(partnerId, actorId, module, "configure");
    if (!canConfigure) {
      return { ok: false as const, status: 403, message: "Sem permissão para configurar a matriz." };
    }
    const role = parsed.data.payload?.role as PartnerErpRole | undefined;
    const resource = parsed.data.payload?.resource as PartnerErpResource | undefined;
    const permAction = parsed.data.payload?.action as PartnerPermissionAction | undefined;
    const allowed = parsed.data.payload?.allowed as boolean | undefined;
    if (!role || !resource || !permAction || typeof allowed !== "boolean") {
      return { ok: false as const, status: 400, message: "role, resource, action e allowed são obrigatórios." };
    }
    if (!PARTNER_ERP_RESOURCES.includes(resource) || !PARTNER_PERMISSION_ACTIONS.includes(permAction)) {
      return { ok: false as const, status: 400, message: "Resource ou ação inválida." };
    }
    const store = await loadPartnerErpStore(partnerId, "permissoes", {
      matrix: defaultPartnerPermissionMatrix(),
      assignments: [] as PartnerRoleAssignment[],
    });
    const before = store.matrix[role]?.[resource]?.[permAction];
    store.matrix[role][resource][permAction] = allowed;
    await savePartnerErpStore(partnerId, "permissoes", store);
    await auditPartnerErp({
      actorId,
      partnerId,
      module: "permissoes",
      resource: "permission_matrix",
      action: "UPDATE",
      observation: `CONFIGURE ${role}/${resource}/${permAction} → ${allowed}`,
      entityBefore: { role, resource, action: permAction, allowed: before },
      entityAfter: { role, resource, action: permAction, allowed },
    });
    return { ok: true as const, data: { role, resource, action: permAction, allowed } };
  }

  const entityMap = ENTITY_STORE_KEY[module];
  const storeKey = entityMap?.[parsed.data.entity];
  if (!storeKey) {
    return { ok: false as const, status: 400, message: "Entidade não suportada neste módulo." };
  }

  const store = await loadPartnerErpStore<Record<string, unknown[]>>(partnerId, module, {});
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
  await savePartnerErpStore(partnerId, module, store);
  await auditPartnerErp({
    actorId,
    partnerId,
    module,
    resource: parsed.data.entity,
    action: AUDIT_ACTION[parsed.data.action as keyof typeof AUDIT_ACTION] ?? "UPDATE",
    resourceId: parsed.data.id,
    entityBefore: before,
    entityAfter: after,
    observation: `${parsed.data.action} em ${parsed.data.entity}`,
  });

  return { ok: true as const, data: after ?? { deleted: parsed.data.id } };
}
