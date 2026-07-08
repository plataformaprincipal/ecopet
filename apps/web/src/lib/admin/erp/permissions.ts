export const ADMIN_ERP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN_FULL",
  "FINANCEIRO",
  "CONTABIL",
  "JURIDICO",
  "RH",
  "COMERCIAL",
  "MARKETING",
  "PRODUTO",
  "TI",
  "SEGURANCA",
  "SUPORTE",
  "LEITURA",
] as const;

export type AdminErpRole = (typeof ADMIN_ERP_ROLES)[number];

export const ADMIN_PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "approve",
  "suspend",
  "delete",
  "export",
  "configure",
] as const;

export type AdminPermissionAction = (typeof ADMIN_PERMISSION_ACTIONS)[number];

export const ADMIN_ERP_MODULES = [
  "dashboard",
  "empresa",
  "operacao",
  "financeiro",
  "contabil",
  "juridico",
  "rh",
  "comercial",
  "marketing",
  "produto",
  "ti",
  "seguranca",
  "ia",
  "integracoes",
  "automacoes",
  "suporte",
  "auditoria",
  "configuracoes",
] as const;

export type AdminErpModule = (typeof ADMIN_ERP_MODULES)[number];

export type AdminPermissionMatrix = Record<
  AdminErpRole,
  Record<AdminErpModule, Record<AdminPermissionAction, boolean>>
>;

function all(value: boolean): Record<AdminPermissionAction, boolean> {
  return {
    view: value,
    create: value,
    edit: value,
    approve: value,
    suspend: value,
    delete: value,
    export: value,
    configure: value,
  };
}

function readOnly(): Record<AdminPermissionAction, boolean> {
  return { view: true, create: false, edit: false, approve: false, suspend: false, delete: false, export: false, configure: false };
}

function buildRow(
  overrides: Partial<Record<AdminErpModule, Partial<Record<AdminPermissionAction, boolean>>>>
): Record<AdminErpModule, Record<AdminPermissionAction, boolean>> {
  const base = {} as Record<AdminErpModule, Record<AdminPermissionAction, boolean>>;
  for (const mod of ADMIN_ERP_MODULES) {
    base[mod] = { ...readOnly(), ...(overrides[mod] ?? {}) };
  }
  return base;
}

export function defaultAdminPermissionMatrix(): AdminPermissionMatrix {
  const full = buildRow(
    Object.fromEntries(ADMIN_ERP_MODULES.map((m) => [m, all(true)])) as Partial<
      Record<AdminErpModule, Partial<Record<AdminPermissionAction, boolean>>>
    >
  );
  const matrix = {} as AdminPermissionMatrix;
  matrix.SUPER_ADMIN = full;
  matrix.ADMIN_FULL = full;
  matrix.FINANCEIRO = buildRow({
    dashboard: { view: true, export: true },
    financeiro: all(true),
    contabil: all(true),
    auditoria: { view: true, export: true },
  });
  matrix.CONTABIL = buildRow({
    dashboard: { view: true, export: true },
    contabil: all(true),
    financeiro: { view: true, export: true },
    auditoria: { view: true, export: true },
  });
  matrix.JURIDICO = buildRow({
    dashboard: { view: true },
    juridico: all(true),
    auditoria: { view: true, export: true },
    seguranca: { view: true, export: true },
  });
  matrix.RH = buildRow({ dashboard: { view: true }, rh: all(true), configuracoes: { view: true } });
  matrix.COMERCIAL = buildRow({ dashboard: { view: true }, comercial: all(true), marketing: { view: true, create: true, edit: true } });
  matrix.MARKETING = buildRow({ dashboard: { view: true }, marketing: all(true) });
  matrix.PRODUTO = buildRow({ dashboard: { view: true }, produto: all(true) });
  matrix.TI = buildRow({
    dashboard: { view: true },
    ti: all(true),
    integracoes: all(true),
    automacoes: all(true),
    ia: { view: true, configure: true },
  });
  matrix.SEGURANCA = buildRow({
    dashboard: { view: true },
    seguranca: all(true),
    auditoria: all(true),
    configuracoes: { view: true },
  });
  matrix.SUPORTE = buildRow({ dashboard: { view: true }, suporte: all(true), operacao: { view: true, edit: true } });
  matrix.LEITURA = buildRow({});
  return matrix;
}

export const ADMIN_ROLE_LABELS: Record<AdminErpRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_FULL: "Admin Completo",
  FINANCEIRO: "Financeiro",
  CONTABIL: "Contábil",
  JURIDICO: "Jurídico",
  RH: "RH",
  COMERCIAL: "Comercial",
  MARKETING: "Marketing",
  PRODUTO: "Produto",
  TI: "TI",
  SEGURANCA: "Segurança",
  SUPORTE: "Suporte",
  LEITURA: "Somente leitura",
};
