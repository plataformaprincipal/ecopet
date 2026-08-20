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
];
