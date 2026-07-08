import type { PartnerErpModuleId } from "./types";
import {
  canPartner,
  resolvePartnerRole,
  type PartnerErpResource,
  type PartnerPermissionAction,
  PARTNER_ERP_RESOURCES,
  PARTNER_PERMISSION_ACTIONS,
} from "./permissions";
import { loadPartnerErpStore } from "./store";
import { defaultPartnerPermissionMatrix, type PartnerRoleAssignment } from "./permissions";
import { PARTNER_ERP_MODULE_RESOURCE } from "./module-registry";

type PermStore = {
  matrix: ReturnType<typeof defaultPartnerPermissionMatrix>;
  assignments: PartnerRoleAssignment[];
};

export function resolveModuleResource(module: PartnerErpModuleId | string): PartnerErpResource {
  return PARTNER_ERP_MODULE_RESOURCE[module as PartnerErpModuleId] ?? "dashboard";
}

export async function assertPartnerErpPermission(
  partnerId: string,
  actorUserId: string,
  module: PartnerErpModuleId | string,
  action: PartnerPermissionAction
): Promise<{ allowed: boolean; role: string }> {
  const store = await loadPartnerErpStore<PermStore>(partnerId, "permissoes", {
    matrix: defaultPartnerPermissionMatrix(),
    assignments: [],
  });
  const role = resolvePartnerRole(partnerId, actorUserId, store.assignments);
  const resource = resolveModuleResource(module);
  const allowed = canPartner(store.matrix, role, resource, action);
  return { allowed, role };
}

/** Verifica permissão por resource explícito (matriz de permissões). */
export async function assertPartnerResourcePermission(
  partnerId: string,
  actorUserId: string,
  resource: PartnerErpResource,
  action: PartnerPermissionAction
): Promise<{ allowed: boolean; role: string }> {
  const store = await loadPartnerErpStore<PermStore>(partnerId, "permissoes", {
    matrix: defaultPartnerPermissionMatrix(),
    assignments: [],
  });
  const role = resolvePartnerRole(partnerId, actorUserId, store.assignments);
  const allowed = canPartner(store.matrix, role, resource, action);
  return { allowed, role };
}

export function listModulePermissionSummary(
  matrix: ReturnType<typeof defaultPartnerPermissionMatrix>,
  role: string
) {
  const roleKey = role as keyof typeof matrix;
  const row = matrix[roleKey];
  if (!row) return [];
  return PARTNER_ERP_RESOURCES.map((resource) => ({
    resource,
    actions: PARTNER_PERMISSION_ACTIONS.filter((action) => row[resource]?.[action]),
  }));
}
