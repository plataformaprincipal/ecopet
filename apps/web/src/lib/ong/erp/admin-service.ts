import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { kpi } from "./types";
import { loadNgoErpStore, loadNgoAuditTrail } from "./store";
import {
  defaultNgoPermissionMatrix,
  NGO_ERP_RESOURCES,
  NGO_PERMISSION_ACTIONS,
  NGO_ERP_ROLES,
} from "./permissions";

export {
  getNgoVoluntariadoModule,
  getNgoFinanceiroModule,
  getNgoAdministrativoModule,
  getNgoEspacoFisicoModule,
  getNgoParceriasModule,
} from "./ngo-operations-service";

export {
  getNgoIntegracoesModule,
  getNgoAutomacoesModule,
  getNgoMarketingModule,
  getNgoIaModule,
} from "./ngo-platform-service";

export async function getNgoConfiguracoesModule(prisma: PrismaClient, ongId: string): Promise<ErpModuleResponse> {
  const store = await loadNgoErpStore(ongId, "configuracoes", {
    matrix: defaultNgoPermissionMatrix(),
    assignments: [] as Array<Record<string, unknown>>,
    preferences: {} as Record<string, unknown>,
  });
  const profile = await prisma.ongProfile.findUnique({
    where: { userId: ongId },
    select: {
      ongName: true,
      verificationStatus: true,
      acceptsDonations: true,
      cnpj: true,
      city: true,
      state: true,
    },
  });
  const audit = await loadNgoAuditTrail(ongId, "configuracoes", 8);

  const matrixRows = NGO_ERP_RESOURCES.flatMap((resource) =>
    NGO_PERMISSION_ACTIONS.map((action) => ({
      id: `${resource}-${action}`,
      modulo: resource,
      acao: action,
      papeis: NGO_ERP_ROLES.filter((role) => store.matrix[role]?.[resource]?.[action]).join(", ") || "—",
    }))
  );

  return {
    moduleId: "configuracoes",
    title: "Configurações",
    kpis: [
      kpi("status", "Verificação", profile?.verificationStatus ?? "PENDING"),
      kpi("donations", "Aceita doações", profile?.acceptsDonations ? "Sim" : "Não"),
      kpi("roles", "Papéis", NGO_ERP_ROLES.length),
    ],
    tables: [
      {
        id: "profile",
        label: "Perfil",
        rows: profile
          ? [
              {
                id: ongId,
                nome: profile.ongName,
                cnpj: profile.cnpj,
                cidade: profile.city,
                estado: profile.state,
              },
            ]
          : [],
      },
      { id: "permissions", label: "Permissões por módulo", rows: matrixRows },
      { id: "audit", label: "Auditoria recente", rows: audit },
    ],
    quickActions: [
      { label: "Perfil da ONG", href: "/ngo/profile" },
      { label: "Configurações", href: "/ngo/settings" },
    ],
    permissionMatrix: store.matrix,
    disclaimer: "Alterações sensíveis geram AuditLog.",
  };
}
