export const PARTNER_ERP_ROLES = [
  "SUPER_ADMIN",
  "GERENTE",
  "FINANCEIRO",
  "MARKETING",
  "VENDEDOR",
  "VETERINÁRIO",
  "ATENDENTE",
  "ESTOQUISTA",
  "RH",
  "LEITURA",
] as const;

export type PartnerErpRole = (typeof PARTNER_ERP_ROLES)[number];

export const PARTNER_PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "approve",
  "delete",
  "export",
  "configure",
] as const;

export type PartnerPermissionAction = (typeof PARTNER_PERMISSION_ACTIONS)[number];

export const PARTNER_ERP_RESOURCES = [
  "dashboard",
  "rh",
  "juridico",
  "administrativo",
  "compras",
  "fornecedores",
  "permissoes",
  "financeiro",
  "contabil",
  "comercial",
  "crm",
  "vendas",
  "analytics",
  "infraestrutura",
  "ti",
  "equipamentos",
  "iot",
  "automacoes",
  "ia",
  "marketing",
  "social",
  "clientes",
  "fidelidade",
  "marketplace",
  "veterinario",
  "loja",
  "integracoes",
  "laboratorio",
  "suporte",
  "parcerias",
] as const;

export type PartnerErpResource = (typeof PARTNER_ERP_RESOURCES)[number];

export type PartnerPermissionMatrix = Record<
  PartnerErpRole,
  Record<PartnerErpResource, Record<PartnerPermissionAction, boolean>>
>;

export type PartnerRoleAssignment = {
  id: string;
  userId: string;
  userName: string;
  role: PartnerErpRole;
  createdAt: string;
};

function allActions(value: boolean): Record<PartnerPermissionAction, boolean> {
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

function readOnly(): Record<PartnerPermissionAction, boolean> {
  return { view: true, create: false, edit: false, approve: false, delete: false, export: false, configure: false };
}

function buildRoleRow(
  overrides: Partial<Record<PartnerErpResource, Partial<Record<PartnerPermissionAction, boolean>>>>
): Record<PartnerErpResource, Record<PartnerPermissionAction, boolean>> {
  const base = {} as Record<PartnerErpResource, Record<PartnerPermissionAction, boolean>>;
  for (const res of PARTNER_ERP_RESOURCES) {
    base[res] = { ...readOnly(), ...(overrides[res] ?? {}) };
  }
  return base;
}

/** Matriz padrão de permissões do ERP parceiro. */
export function defaultPartnerPermissionMatrix(): PartnerPermissionMatrix {
  const full = buildRoleRow(
    Object.fromEntries(PARTNER_ERP_RESOURCES.map((r) => [r, allActions(true)])) as Partial<
      Record<PartnerErpResource, Partial<Record<PartnerPermissionAction, boolean>>>
    >
  );

  const matrix = {} as PartnerPermissionMatrix;
  matrix.SUPER_ADMIN = full;

  matrix.GERENTE = buildRoleRow({
    dashboard: allActions(true),
    rh: { view: true, create: true, edit: true, approve: true, export: true },
    juridico: { view: true, create: true, edit: true, approve: true, export: true },
    administrativo: allActions(true),
    compras: { view: true, create: true, edit: true, approve: true, export: true },
    fornecedores: { view: true, create: true, edit: true, export: true },
    financeiro: { view: true, export: true },
    contabil: { view: true, export: true },
    comercial: allActions(true),
    crm: allActions(true),
    vendas: allActions(true),
    analytics: { view: true, export: true },
    permissoes: { view: true },
    marketing: allActions(true),
    social: allActions(true),
    clientes: allActions(true),
    fidelidade: allActions(true),
    marketplace: allActions(true),
    ia: { view: true, create: true },
    infraestrutura: { view: true, create: true, edit: true, export: true },
    ti: { view: true, export: true },
    equipamentos: { view: true, create: true, edit: true, export: true },
    iot: { view: true, export: true },
    automacoes: { view: true, create: true, edit: true },
    veterinario: allActions(true),
    loja: allActions(true),
    integracoes: { view: true, configure: true, export: true },
    laboratorio: { view: true, configure: true },
    suporte: { view: true, create: true, edit: true },
    parcerias: allActions(true),
  });

  matrix.FINANCEIRO = buildRoleRow({
    dashboard: { view: true, export: true },
    financeiro: allActions(true),
    contabil: allActions(true),
    compras: { view: true, create: true, edit: true, approve: true, export: true },
    fornecedores: { view: true, export: true },
    analytics: { view: true, export: true },
    integracoes: { view: true, export: true },
    loja: { view: true, export: true },
  });

  matrix.MARKETING = buildRoleRow({
    dashboard: { view: true },
    comercial: { view: true, create: true, edit: true, export: true },
    crm: { view: true, create: true, edit: true, export: true },
    vendas: { view: true, export: true },
    analytics: { view: true, export: true },
    marketing: allActions(true),
    social: allActions(true),
    parcerias: allActions(true),
    clientes: { view: true, create: true, edit: true, export: true },
    fidelidade: { view: true, create: true, edit: true, export: true },
    marketplace: { view: true, create: true, edit: true, export: true },
    ia: { view: true, create: true },
  });

  matrix.VENDEDOR = buildRoleRow({
    dashboard: { view: true },
    comercial: { view: true, create: true, edit: true },
    crm: { view: true, create: true, edit: true },
    vendas: allActions(true),
    analytics: { view: true },
    clientes: { view: true, export: true },
    loja: { view: true, create: true },
    marketplace: { view: true },
  });

  matrix.VETERINÁRIO = buildRoleRow({
    dashboard: { view: true },
    rh: { view: true },
    administrativo: { view: true, create: true, edit: true },
    crm: { view: true, create: true, edit: true },
    vendas: { view: true, create: true },
    clientes: { view: true, create: true, edit: true },
    veterinario: allActions(true),
    loja: { view: true, create: true },
    suporte: { view: true, create: true },
    ia: { view: true, create: true },
  });

  matrix.ATENDENTE = buildRoleRow({
    dashboard: { view: true },
    crm: { view: true, create: true, edit: true },
    vendas: { view: true, create: true },
    administrativo: { view: true, create: true },
    clientes: { view: true, create: true, edit: true },
    loja: { view: true, create: true, edit: true },
    suporte: { view: true, create: true },
    fidelidade: { view: true },
  });

  matrix.ESTOQUISTA = buildRoleRow({
    dashboard: { view: true },
    compras: { view: true, create: true, edit: true },
    fornecedores: { view: true, create: true, edit: true },
    analytics: { view: true },
    marketplace: { view: true, create: true, edit: true },
    loja: { view: true, create: true, edit: true, export: true },
    equipamentos: { view: true },
  });

  matrix.RH = buildRoleRow({
    dashboard: { view: true },
    rh: allActions(true),
    administrativo: { view: true, create: true, edit: true, export: true },
    permissoes: { view: true },
  });

  matrix.LEITURA = buildRoleRow({});

  return matrix;
}

export function resolvePartnerRole(
  ownerUserId: string,
  actorUserId: string,
  assignments: PartnerRoleAssignment[]
): PartnerErpRole {
  if (actorUserId === ownerUserId) return "SUPER_ADMIN";
  const found = assignments.find((a) => a.userId === actorUserId);
  return found?.role ?? "LEITURA";
}

export function canPartner(
  matrix: PartnerPermissionMatrix,
  role: PartnerErpRole,
  resource: PartnerErpResource,
  action: PartnerPermissionAction
): boolean {
  return matrix[role]?.[resource]?.[action] ?? false;
}
