import { brl, fixedSku } from "./catalog-helpers";
import type { CatalogItem } from "./types";

const SECTION = "10. Catálogo de serviços de IA";

function aiSku(
  sku: string,
  name: string,
  unit: string,
  price: number,
  cost: number,
  capabilityId: string | undefined,
  extra?: { allowZero?: boolean }
): CatalogItem {
  const hasCapability = Boolean(capabilityId);
  return fixedSku({
    sku,
    name,
    suite: "AI",
    kind: "AI",
    amountCents: brl(price),
    unit,
    costReferenceCents: brl(cost),
    allowZero: extra?.allowZero,
    capabilityId,
    commercialAvailability: hasCapability ? "FEATURE_FLAGGED" : "DISABLED",
    revenueRecognition: "SUBSCRIPTION",
    portfolioSuiteId: "ai",
    sourceSection: SECTION,
  });
}

type CommerceRow = {
  sku: string;
  name: string;
  unit: string;
  reais: number;
  cost: number;
  capabilityId: string;
  billingType: string;
  usageLimit: number;
  priceSource: "DOCUMENT" | "DOCUMENT_DERIVED";
  priceReference: string;
  sourceSection: string;
};

const COMMERCE_ROWS: CommerceRow[] = [
  { sku: "AI_ECCOVET", name: "EccoVet AI", unit: "plano de 30 dias", reais: 29.9, cost: 9, capabilityId: "eccovet.assessment", billingType: "SUBSCRIPTION", usageLimit: 5, priceSource: "DOCUMENT", priceReference: "AI-T02", sourceSection: "AI-T02 — Care Navigator — R$ 29,90/tutor/mês" },
  { sku: "AI_ECCOVET_TRIAGE", name: "EccoVet Triagem", unit: "por avaliação", reais: 39.9, cost: 9.1, capabilityId: "eccovet.triage", billingType: "ONE_TIME", usageLimit: 1, priceSource: "DOCUMENT", priceReference: "SAU-006", sourceSection: "SAU-006 — Triagem remota informativa — R$ 39,90" },
  { sku: "AI_ECCOVET_REPORT", name: "EccoVet Relatório", unit: "por relatório", reais: 19.9, cost: 5.5, capabilityId: "eccovet.report", billingType: "ONE_TIME", usageLimit: 1, priceSource: "DOCUMENT", priceReference: "AI-T10", sourceSection: "AI-T10 — Organizador de laudos — R$ 19,90/evento" },
  { sku: "AI_ECCOVET_EXAMS", name: "EccoVet Exames", unit: "por análise", reais: 14.9, cost: 4, capabilityId: "eccovet.exams", billingType: "ONE_TIME", usageLimit: 1, priceSource: "DOCUMENT", priceReference: "AI-T13", sourceSection: "AI-T13 — Assistente de exames — R$ 14,90/evento" },
  { sku: "AI_ECCOVET_VISION", name: "EccoVet Vision", unit: "por análise", reais: 14.9, cost: 4, capabilityId: "eccovet.vision", billingType: "ONE_TIME", usageLimit: 1, priceSource: "DOCUMENT_DERIVED", priceReference: "AI-T13", sourceSection: "Preço derivado de AI-T13 (assistente de exames / evento). SKU Vision não existia na planilha." },
  { sku: "AI_ECCONUTRI", name: "EccoNutri AI", unit: "plano de 30 dias", reais: 14.9, cost: 4, capabilityId: "ecconutri.assessment", billingType: "SUBSCRIPTION", usageLimit: 4, priceSource: "DOCUMENT", priceReference: "AI-T04", sourceSection: "AI-T04 — Routine Coach — R$ 14,90/tutor/mês" },
  { sku: "AI_ECCOPESO", name: "EccoPeso AI", unit: "plano de 30 dias", reais: 9.9, cost: 2.5, capabilityId: "eccopeso.assessment", billingType: "SUBSCRIPTION", usageLimit: 30, priceSource: "DOCUMENT_DERIVED", priceReference: "AI-T08", sourceSection: "Balança/atividade — R$ 9,90/mês (SKU nominal não encontrado; faixa mensal documentada AI-T03/AI-T08)." },
  { sku: "AI_ECCODENTAL", name: "EccoDental AI", unit: "por análise", reais: 14.9, cost: 4, capabilityId: "eccodental.vision", billingType: "ONE_TIME", usageLimit: 1, priceSource: "DOCUMENT_DERIVED", priceReference: "AI-T13", sourceSection: "Preço derivado da categoria de análise multimodal/evento (AI-T13)." },
  { sku: "AI_ECCOBEHAVIOR", name: "EccoBehavior AI", unit: "plano de 30 dias", reais: 14.9, cost: 4, capabilityId: "eccobehavior.assessment", billingType: "SUBSCRIPTION", usageLimit: 4, priceSource: "DOCUMENT", priceReference: "AI-T04", sourceSection: "AI-T04 — Routine Coach — R$ 14,90/tutor/mês" },
  { sku: "AI_ECCOVACCINE", name: "EccoVacina AI", unit: "plano de 30 dias", reais: 14.9, cost: 4, capabilityId: "eccovacina.plan", billingType: "SUBSCRIPTION", usageLimit: 12, priceSource: "DOCUMENT_DERIVED", priceReference: "AI-T04", sourceSection: "Produto recorrente de organização (carteira/calendário). Preço derivado de AI-T04." },
  { sku: "AI_ECCOMED", name: "EccoMed AI", unit: "por análise", reais: 9.9, cost: 2.5, capabilityId: "eccomed.review", billingType: "ONE_TIME", usageLimit: 1, priceSource: "DOCUMENT", priceReference: "AI-T11", sourceSection: "AI-T11 — Assistente de medicamentos — R$ 9,90/evento" },
  { sku: "AI_ECCOCHECKUP", name: "EccoCheckup AI", unit: "plano de 30 dias", reais: 29.9, cost: 9, capabilityId: "eccocheckup.assessment", billingType: "SUBSCRIPTION", usageLimit: 2, priceSource: "DOCUMENT_DERIVED", priceReference: "AI-T02", sourceSection: "Base Care Navigator / acompanhamento inteligente (AI-T02). SKU nominal Checkup não existia." },
  { sku: "AI_PET_HEALTH_PROFILE", name: "Pet Health Profile", unit: "ativação", reais: 49.9, cost: 10.3, capabilityId: "pethealth.profile", billingType: "ACTIVATION", usageLimit: 1, priceSource: "DOCUMENT", priceReference: "SAU-011", sourceSection: "SAU-011 — Organização de prontuário — R$ 49,90" },
];

export const AI_COMMERCE_CATALOG: CatalogItem[] = COMMERCE_ROWS.map((row) => ({
  ...fixedSku({
    sku: row.sku,
    name: row.name,
    suite: "AI",
    kind: "AI",
    amountCents: brl(row.reais),
    unit: row.unit,
    costReferenceCents: brl(row.cost),
    capabilityId: row.capabilityId,
    commercialAvailability: "FEATURE_FLAGGED",
    revenueRecognition: "SUBSCRIPTION",
    portfolioSuiteId: "ai",
    sourceSection: row.sourceSection,
  }),
  metadata: {
    priceSource: row.priceSource,
    priceReference: row.priceReference,
    billingType: row.billingType,
    usageLimit: row.usageLimit,
    commercialPending: false,
  },
}));

export const AI_CATALOG: CatalogItem[] = [
  aiSku("AI-T01", "EccoPet Concierge", "Tutor / mês", 19.9, 5.5, "concierge"),
  aiSku("AI-T02", "Care Navigator", "Tutor / mês", 29.9, 9, "care_navigator"),
  aiSku("AI-T03", "Shopping Agent", "Tutor / mês", 9.9, 2.5, "shopping_agent"),
  aiSku("AI-T04", "Routine Coach", "Tutor / mês", 14.9, 4, "routine_coach"),
  aiSku("AI-T05", "Lost Pet Agent", "Evento", 39.9, 11, "lost_pet"),
  aiSku("AI-T06", "Travel Agent Pet", "Evento", 59.9, 18, "travel_agent"),
  aiSku("AI-T07", "Adoption Assistant", "ONG; patrocinado", 0, 4, "adoption_assistant", { allowZero: true }),
  aiSku("AI-T08", "Content Studio Tutor", "Tutor / mês", 9.9, 2.5, "content_studio"),
  aiSku("AI-T09", "Assistente de emergência", "Evento", 14.9, 4.5, undefined),
  aiSku("AI-T10", "Organizador de laudos", "Evento", 19.9, 5.5, undefined),
  aiSku("AI-T11", "Assistente de medicamentos", "Evento", 9.9, 2.5, undefined),
  aiSku("AI-T12", "Assistente de tratamento", "Mês", 19.9, 6, undefined),
  aiSku("AI-T13", "Assistente de exames", "Evento", 14.9, 4, undefined),
  aiSku("AI-T14", "Assistente multilíngue", "Mês", 19.9, 6, undefined),
  aiSku("AI-P01", "Sales Agent", "Parceiro / mês", 119.9, 28, "sales_agent"),
  aiSku("AI-P02", "CRM Agent", "Parceiro / mês", 89.9, 22, "crm_agent"),
  aiSku("AI-P03", "Catalog Agent", "Parceiro / mês", 69.9, 18, "catalog_agent"),
  aiSku("AI-P04", "Pricing Agent", "Parceiro / mês", 99.9, 25, "pricing_agent"),
  aiSku("AI-P05", "Inventory Agent", "Parceiro / mês", 89.9, 24, "inventory_agent"),
  aiSku("AI-P06", "Capacity Agent", "Parceiro / mês", 69.9, 18, "service_capacity_agent"),
  aiSku("AI-P07", "Finance Agent", "Parceiro / mês", 139.9, 35, "finance_agent"),
  aiSku("AI-P08", "Ads Copilot", "Parceiro / mês", 79.9, 20, "ads_copilot"),
  aiSku("AI-P09", "Support Agent", "Parceiro / mês", 119.9, 32, "support_agent_b2b"),
  aiSku("AI-P10", "Compliance Agent", "Parceiro / mês", 149.9, 42, "compliance_agent"),
  aiSku("AI-P11", "Cobrança e conciliação", "Parceiro / mês", 99.9, 26, undefined),
  aiSku("AI-P12", "Forecast e relatórios", "Parceiro / mês", 129.9, 34, undefined),
  aiSku("AI-P13", "Recuperação de clientes", "Parceiro / mês", 89.9, 23, undefined),
  aiSku("AI-P14", "Reputação", "Parceiro / mês", 69.9, 18, undefined),
  aiSku("AI-C01", "Transcrição clínica", "Hora", 24.9, 7.5, undefined),
  aiSku("AI-C02", "Resumo clínico", "Evento", 19.9, 6, undefined),
  aiSku("AI-C03", "Estruturação de prontuário", "Clínica / mês", 149.9, 40, undefined),
  aiSku("AI-C04", "IA radiológica", "Exame", 39.9, 12, undefined),
  aiSku("AI-C05", "Revisão humana radiológica", "Exame", 149.9, 95, undefined),
  ...AI_COMMERCE_CATALOG,
];
