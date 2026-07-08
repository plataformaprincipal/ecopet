import type { NgoErpModuleId } from "./types";
import {
  canNgo,
  defaultNgoPermissionMatrix,
  resolveNgoRole,
  type NgoErpResource,
  type NgoPermissionAction,
  type NgoRoleAssignment,
} from "./permissions";
import { loadNgoErpStore } from "./store";

type PermStore = {
  matrix: ReturnType<typeof defaultNgoPermissionMatrix>;
  assignments: NgoRoleAssignment[];
};

const MODULE_RESOURCE: Record<NgoErpModuleId, NgoErpResource> = {
  dashboard: "dashboard",
  animais: "animais",
  adocoes: "adocoes",
  doacoes: "doacoes",
  campanhas: "campanhas",
  social: "social",
  voluntariado: "voluntariado",
  financeiro: "financeiro",
  administrativo: "administrativo",
  "espaco-fisico": "espaco-fisico",
  parcerias: "parcerias",
  marketing: "marketing",
  automacoes: "automacoes",
  integracoes: "integracoes",
  ia: "ia",
  configuracoes: "configuracoes",
};

export async function assertNgoErpPermission(
  ongId: string,
  actorUserId: string,
  module: NgoErpModuleId | string,
  action: NgoPermissionAction
): Promise<{ allowed: boolean; role: string }> {
  const store = await loadNgoErpStore<PermStore>(ongId, "configuracoes", {
    matrix: defaultNgoPermissionMatrix(),
    assignments: [],
  });
  const role = resolveNgoRole(ongId, actorUserId, store.assignments);
  const resource = MODULE_RESOURCE[module as NgoErpModuleId] ?? "dashboard";
  const allowed = canNgo(store.matrix, role, resource, action);
  return { allowed, role };
}
