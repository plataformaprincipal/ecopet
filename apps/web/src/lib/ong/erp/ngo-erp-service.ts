import type { PrismaClient } from "@prisma/client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import type { NgoErpModuleId } from "./types";
import { emptyNgoModule, NGO_ERP_MODULES } from "./types";
import {
  getNgoDashboardModule,
  getNgoAnimaisModule,
  getNgoAdocoesModule,
  getNgoDoacoesModule,
  getNgoCampanhasModule,
  getNgoSocialModule,
} from "./ops-service";
import {
  getNgoVoluntariadoModule,
  getNgoFinanceiroModule,
  getNgoAdministrativoModule,
  getNgoEspacoFisicoModule,
  getNgoParceriasModule,
  getNgoMarketingModule,
  getNgoAutomacoesModule,
  getNgoIntegracoesModule,
  getNgoIaModule,
  getNgoConfiguracoesModule,
} from "./admin-service";

const HANDLERS: Record<NgoErpModuleId, (p: PrismaClient, id: string) => Promise<ErpModuleResponse>> = {
  dashboard: getNgoDashboardModule,
  animais: getNgoAnimaisModule,
  adocoes: getNgoAdocoesModule,
  doacoes: getNgoDoacoesModule,
  campanhas: getNgoCampanhasModule,
  social: getNgoSocialModule,
  voluntariado: getNgoVoluntariadoModule,
  financeiro: getNgoFinanceiroModule,
  administrativo: getNgoAdministrativoModule,
  "espaco-fisico": getNgoEspacoFisicoModule,
  parcerias: getNgoParceriasModule,
  marketing: getNgoMarketingModule,
  automacoes: getNgoAutomacoesModule,
  integracoes: getNgoIntegracoesModule,
  ia: getNgoIaModule,
  configuracoes: getNgoConfiguracoesModule,
};

export async function getNgoErpModule(
  prisma: PrismaClient,
  ongId: string,
  moduleId: NgoErpModuleId
): Promise<ErpModuleResponse> {
  const handler = HANDLERS[moduleId];
  if (!handler) return emptyNgoModule(moduleId);
  return handler(prisma, ongId);
}

export { NGO_ERP_MODULES };
