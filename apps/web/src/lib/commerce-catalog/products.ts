import { getCatalogBySku } from "@/lib/pricing/catalog";
import type { CatalogItem, PricingCommercialAvailability } from "@/lib/pricing/types";

export const CATALOG_ITEM_TYPE = "CATALOG_SKU" as const;
export const ENTERTAINMENT_SKU = "ENT-DRAFT" as const;

export type CommercialFamily =
  | "ONE"
  | "PRO"
  | "TELEHEALTH"
  | "HEALTH_PLAN"
  | "EXAMS"
  | "PROTECT"
  | "ENTERTAINMENT"
  | "ADS"
  | "AI_ADDON"
  | "IOT"
  | "API"
  | "HEALTH_DIGITAL";

export type CommercialStatus = "PURCHASABLE" | "CATALOG_ONLY" | "PARTNER_REQUIRED" | "PRICE_PENDING";

export type CommercialProduct = {
  sku: string;
  family: CommercialFamily;
  name: string;
  description: string;
  href: string;
  petRequired: boolean;
  partnerPanel: boolean;
  recurring: boolean;
  requiresLicensedVet: boolean;
  requiresInsurer: boolean;
  terms: string;
};

const TERMS_PFO = "Preços e comissões oficiais do Relatório Mestre Financeiro BR-2026.08-v1. Reembolso conforme política do SKU.";
const TERMS_AI_NOT_VET =
  "A IA organiza dados e rascunhos. Diagnóstico, laudo, prescrição e atestado definitivos exigem veterinário habilitado com CRMV.";
const TERMS_INSURANCE =
  "A EccoPet atua como plataforma intermediadora. Prêmio não é receita integral EccoPet. Cobertura só após operador autorizado.";

export const COMMERCIAL_PRODUCTS: CommercialProduct[] = [
  { sku: "ONE-000", family: "ONE", name: "One Free", description: "Plano tutor gratuito com limites de aquisição.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-001", family: "ONE", name: "One Plus", description: "Assinatura tutor de entrada.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-002", family: "ONE", name: "One Care", description: "Assinatura tutor com cuidados ampliados.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-003", family: "ONE", name: "One Family", description: "Assinatura tutor para múltiplos pets.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-004", family: "ONE", name: "One Global", description: "Assinatura tutor completa.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-010", family: "ONE", name: "Add-on IA", description: "Módulo de IA para o plano tutor.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-011", family: "ONE", name: "Add-on emergência digital", description: "Acesso digital a fluxos de emergência.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-012", family: "ONE", name: "Add-on viagem", description: "Benefícios de viagem pet.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-013", family: "ONE", name: "Add-on IoT Connect", description: "Conexão IoT do tutor.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "ONE-014", family: "ONE", name: "Armazenamento adicional", description: "Armazenamento extra de mídia e documentos.", href: "/assinatura", petRequired: false, partnerPanel: false, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-001", family: "PRO", name: "Pro Starter", description: "Plano parceiro de entrada.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-002", family: "PRO", name: "Pro Growth", description: "Plano parceiro de crescimento.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-003", family: "PRO", name: "Pro Clinic", description: "Plano clínico.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-004", family: "PRO", name: "Pro Enterprise", description: "Plano enterprise.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-010", family: "PRO", name: "Usuário adicional", description: "Add-on de usuário.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-011", family: "PRO", name: "Unidade adicional", description: "Add-on de unidade.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-012", family: "PRO", name: "Suporte prioritário", description: "Add-on de suporte.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-013", family: "PRO", name: "Migração de dados", description: "Serviço único de migração.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-014", family: "PRO", name: "Treinamento remoto", description: "Sessão de treinamento.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "PRO-015", family: "PRO", name: "White-label base", description: "White-label mensal.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_PFO },
  { sku: "SAU-006", family: "HEALTH_DIGITAL", name: "Triagem remota informativa", description: "Triagem informativa. Não é diagnóstico veterinário.", href: "/marketplace/saude/teleconsulta", petRequired: true, partnerPanel: true, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-007", family: "TELEHEALTH", name: "Teleorientação veterinária", description: "Orientação por profissional habilitado.", href: "/marketplace/saude/teleconsulta", petRequired: true, partnerPanel: true, recurring: false, requiresLicensedVet: true, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-008", family: "TELEHEALTH", name: "Teleconsulta habilitada", description: "Consulta remota com veterinário habilitado, laudo e CRMV.", href: "/marketplace/saude/teleconsulta", petRequired: true, partnerPanel: true, recurring: false, requiresLicensedVet: true, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-009", family: "EXAMS", name: "Segunda opinião", description: "Segunda opinião de profissional habilitado.", href: "/marketplace/saude/exames", petRequired: true, partnerPanel: true, recurring: false, requiresLicensedVet: true, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-010", family: "EXAMS", name: "Localização/recuperação de laudo", description: "Organização e recuperação de laudos no perfil do pet.", href: "/marketplace/saude/exames", petRequired: true, partnerPanel: false, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-011", family: "HEALTH_DIGITAL", name: "Organização de prontuário", description: "Prontuário digital assistido.", href: "/marketplace/saude/exames", petRequired: true, partnerPanel: false, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-012", family: "HEALTH_DIGITAL", name: "Resumo clínico assistido", description: "Resumo assistido. Rascunho, não laudo final.", href: "/marketplace/saude/exames", petRequired: true, partnerPanel: false, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "SAU-013", family: "HEALTH_DIGITAL", name: "Preparação de consulta", description: "Preparação estruturada da consulta.", href: "/marketplace/saude/exames", petRequired: true, partnerPanel: false, recurring: false, requiresLicensedVet: false, requiresInsurer: false, terms: TERMS_AI_NOT_VET },
  { sku: "PRT-001", family: "HEALTH_PLAN", name: "Clube preventivo", description: "Plano preventivo intermediado. Não é cobertura própria EccoPet.", href: "/marketplace/saude/planos", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-002", family: "HEALTH_PLAN", name: "Plano ambulatorial", description: "Plano ambulatorial via operador. PARTNER_REQUIRED até contrato.", href: "/marketplace/saude/planos", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-003", family: "HEALTH_PLAN", name: "Plano completo", description: "Plano completo via operador.", href: "/marketplace/saude/planos", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-004", family: "PROTECT", name: "Seguro saúde pet", description: "Seguro intermediado. EccoPet não assume risco.", href: "/marketplace/seguro", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-005", family: "PROTECT", name: "Seguro de vida do tutor + cuidado pet", description: "Proteção intermediada.", href: "/marketplace/seguro", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-006", family: "PROTECT", name: "Assistência emergencial", description: "Assistência intermediada.", href: "/marketplace/seguro", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-007", family: "PROTECT", name: "Proteção de viagem", description: "Proteção de viagem intermediada.", href: "/marketplace/seguro", petRequired: true, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-008", family: "PROTECT", name: "Proteção do parceiro", description: "Proteção B2B intermediada.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-009", family: "PROTECT", name: "Seguro cyber parceiro", description: "Seguro cyber intermediado.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  { sku: "PRT-010", family: "PROTECT", name: "Interrupção de negócio", description: "Proteção de interrupção intermediada.", href: "/partner/planos", petRequired: false, partnerPanel: true, recurring: true, requiresLicensedVet: false, requiresInsurer: true, terms: TERMS_INSURANCE },
  {
    sku: ENTERTAINMENT_SKU,
    family: "ENTERTAINMENT",
    name: "Plano de Entretenimento Pet",
    description: "Conteúdo, desafios, gamificação e experiências. Sem preço oficial no PFO.",
    href: "/marketplace/entretenimento",
    petRequired: false,
    partnerPanel: false,
    recurring: true,
    requiresLicensedVet: false,
    requiresInsurer: false,
    terms: "Produto estruturado. PRICE_PENDING — preço não inventado. billing_enabled=false.",
  },
];

export function getCommercialProduct(sku: string): CommercialProduct | undefined {
  return COMMERCIAL_PRODUCTS.find((p) => p.sku === sku);
}

export function familyOfSku(sku: string): CommercialFamily {
  const mapped = getCommercialProduct(sku)?.family;
  if (mapped) return mapped;
  if (sku.startsWith("ONE-")) return "ONE";
  if (sku.startsWith("PRO-")) return "PRO";
  if (sku.startsWith("ADS-")) return "ADS";
  if (sku.startsWith("AI-")) return "AI_ADDON";
  if (sku.startsWith("IOT-")) return "IOT";
  if (sku.startsWith("API-")) return "API";
  if (sku.startsWith("PRT-")) return "PROTECT";
  if (sku.startsWith("SAU-")) return "HEALTH_DIGITAL";
  if (sku === ENTERTAINMENT_SKU) return "ENTERTAINMENT";
  return "HEALTH_DIGITAL";
}

export function publicStatus(item: CatalogItem | null | undefined, sku: string): CommercialStatus {
  if (sku === ENTERTAINMENT_SKU) return "PRICE_PENDING";
  const avail = item?.commercialAvailability as PricingCommercialAvailability | undefined;
  if (avail === "PURCHASABLE") return "PURCHASABLE";
  if (avail === "PARTNER_REQUIRED") return "PARTNER_REQUIRED";
  if (avail === "PRICE_PENDING") return "PRICE_PENDING";
  return "CATALOG_ONLY";
}

export function catalogForSku(sku: string): CatalogItem | undefined {
  if (sku === ENTERTAINMENT_SKU) return undefined;
  return getCatalogBySku(sku);
}

export const HEALTH_MARKETPLACE_GROUPS = [
  { id: "consultas", label: "Consultas", skus: ["SAU-001", "SAU-002", "SAU-003"] },
  { id: "teleatendimento", label: "Teleatendimento", skus: ["SAU-006", "SAU-007", "SAU-008"] },
  { id: "exames", label: "Exames", skus: ["SAU-017", "SAU-018", "SAU-019", "SAU-020", "SAU-021", "SAU-022", "SAU-023", "SAU-024", "SAU-025"] },
  { id: "diagnostico", label: "Diagnóstico / exames", skus: ["SAU-009", "SAU-010", "SAU-029", "SAU-030"] },
  { id: "laudos", label: "Laudos", skus: ["SAU-010", "SAU-011", "SAU-012"] },
  { id: "especialidades", label: "Especialidades", skus: ["SAU-039", "SAU-040", "SAU-041", "SAU-042", "SAU-043", "SAU-044", "SAU-045", "SAU-046", "SAU-047"] },
  { id: "tratamentos", label: "Tratamentos", skus: ["SAU-048", "SAU-049", "SAU-050", "SAU-051", "SAU-052", "SAU-053", "SAU-054", "SAU-055", "SAU-056", "SAU-057"] },
  { id: "emergencia", label: "Emergência", skus: ["SAU-004", "SAU-005", "SAU-038"] },
] as const;
