/**
 * Portfólio EccoPet — status honesto. Produto FUTURE/DISABLED não vende.
 */
export type PortfolioStatus =
  | "ACTIVE"
  | "PARTIAL"
  | "FEATURE_FLAGGED"
  | "PARTNER_REQUIRED"
  | "FUTURE"
  | "DISABLED";

export type PortfolioSuite = {
  id: string;
  name: string;
  status: PortfolioStatus;
  commercial: boolean;
  dependency: string;
};

export const ECCOPET_PORTFOLIO: PortfolioSuite[] = [
  { id: "market", name: "EccoPet Market", status: "ACTIVE", commercial: true, dependency: "Parceiros aprovados + catálogo" },
  { id: "services", name: "EccoPet Services", status: "ACTIVE", commercial: true, dependency: "Parceiros com serviços publicados" },
  { id: "ai", name: "EccoPet AI", status: "ACTIVE", commercial: false, dependency: "OpenAI quando AI_ENABLED" },
  { id: "pro", name: "EccoPet Pro", status: "PARTIAL", commercial: true, dependency: "Módulos ERP do parceiro já existentes" },
  { id: "ads", name: "EccoPet Ads", status: "FEATURE_FLAGGED", commercial: false, dependency: "ads_copilot + API de mídia" },
  { id: "one", name: "EccoPet One", status: "FEATURE_FLAGGED", commercial: false, dependency: "Billing recorrente — checkoutEnabled=false" },
  { id: "care", name: "EccoPet Care", status: "PARTIAL", commercial: false, dependency: "Agenda/vacinas do tutor; clínica só com parceiro" },
  { id: "protect", name: "EccoPet Protect", status: "DISABLED", commercial: false, dependency: "Parceiro segurador contratado" },
  { id: "connect", name: "EccoPet Connect", status: "FEATURE_FLAGGED", commercial: false, dependency: "Adaptador IoT real" },
  { id: "social", name: "EccoPet Social", status: "ACTIVE", commercial: false, dependency: "Conta autenticada para interagir" },
  { id: "impact", name: "EccoPet Impact", status: "ACTIVE", commercial: false, dependency: "ONGs aprovadas com listagens" },
  { id: "pay", name: "EccoPet Pay", status: "PARTIAL", commercial: true, dependency: "Mercado Pago — sem carteira própria" },
  { id: "data", name: "EccoPet Data & API", status: "DISABLED", commercial: false, dependency: "Governança, scopes e contratos" },
];

export function isSuiteCommerciallyAvailable(id: string) {
  return ECCOPET_PORTFOLIO.find((s) => s.id === id)?.commercial === true;
}
