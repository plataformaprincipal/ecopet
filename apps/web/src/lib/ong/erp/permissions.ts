export const NGO_ERP_ROLES = ["OWNER", "COORDENADOR", "VOLUNTARIO", "FINANCEIRO", "LEITURA"] as const;
export type NgoErpRole = (typeof NGO_ERP_ROLES)[number];

export const NGO_PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "approve",
  "delete",
  "export",
  "configure",
] as const;
export type NgoPermissionAction = (typeof NGO_PERMISSION_ACTIONS)[number];

export const NGO_ERP_RESOURCES = [
  "dashboard",
  "animais",
  "adocoes",
  "doacoes",
  "campanhas",
  "social",
  "voluntariado",
  "financeiro",
  "administrativo",
  "espaco-fisico",
  "parcerias",
  "marketing",
  "automacoes",
  "integracoes",
  "ia",
  "configuracoes",
] as const;
export type NgoErpResource = (typeof NGO_ERP_RESOURCES)[number];

export type NgoPermissionMatrix = Record<
  NgoErpRole,
  Record<NgoErpResource, Record<NgoPermissionAction, boolean>>
>;

export type NgoRoleAssignment = {
  id: string;
  userId: string;
  userName: string;
  role: NgoErpRole;
  createdAt: string;
};

function allActions(value: boolean): Record<NgoPermissionAction, boolean> {
  return {
    view: value,
    create: value,
    edit: value,
    approve: value,
    delete: value,
    export: value,
    configure: value,
  };
}

function readOnly(): Record<NgoPermissionAction, boolean> {
  return { view: true, create: false, edit: false, approve: false, delete: false, export: false, configure: false };
}

function buildRoleRow(
  overrides: Partial<Record<NgoErpResource, Partial<Record<NgoPermissionAction, boolean>>>>
): Record<NgoErpResource, Record<NgoPermissionAction, boolean>> {
  const base = {} as Record<NgoErpResource, Record<NgoPermissionAction, boolean>>;
  for (const res of NGO_ERP_RESOURCES) {
    base[res] = { ...readOnly(), ...(overrides[res] ?? {}) };
  }
  return base;
}

export function defaultNgoPermissionMatrix(): NgoPermissionMatrix {
  const full = buildRoleRow(
    Object.fromEntries(NGO_ERP_RESOURCES.map((r) => [r, allActions(true)])) as Partial<
      Record<NgoErpResource, Partial<Record<NgoPermissionAction, boolean>>>
    >
  );
  const matrix = {} as NgoPermissionMatrix;
  matrix.OWNER = full;
  matrix.COORDENADOR = buildRoleRow({
    dashboard: allActions(true),
    animais: allActions(true),
    adocoes: allActions(true),
    doacoes: { view: true, create: true, edit: true, export: true },
    campanhas: allActions(true),
    social: allActions(true),
    voluntariado: allActions(true),
    financeiro: { view: true, export: true },
    administrativo: allActions(true),
    "espaco-fisico": { view: true, create: true, edit: true },
    parcerias: { view: true, create: true, edit: true },
    marketing: allActions(true),
    automacoes: { view: true, create: true, edit: true },
    integracoes: { view: true, configure: true },
    ia: { view: true, create: true },
    configuracoes: { view: true },
  });
  matrix.VOLUNTARIO = buildRoleRow({
    dashboard: { view: true },
    animais: { view: true, create: true, edit: true },
    adocoes: { view: true, create: true, edit: true },
    campanhas: { view: true },
    social: { view: true, create: true },
    voluntariado: { view: true },
  });
  matrix.FINANCEIRO = buildRoleRow({
    dashboard: { view: true, export: true },
    doacoes: allActions(true),
    financeiro: allActions(true),
    campanhas: { view: true, export: true },
  });
  matrix.LEITURA = buildRoleRow({});
  return matrix;
}

export function resolveNgoRole(
  ownerUserId: string,
  actorUserId: string,
  assignments: NgoRoleAssignment[]
): NgoErpRole {
  if (actorUserId === ownerUserId) return "OWNER";
  const found = assignments.find((a) => a.userId === actorUserId);
  return found?.role ?? "LEITURA";
}

export function canNgo(
  matrix: NgoPermissionMatrix,
  role: NgoErpRole,
  resource: NgoErpResource,
  action: NgoPermissionAction
): boolean {
  return matrix[role]?.[resource]?.[action] ?? false;
}
