import { OFFICIAL_CATALOG } from "@/lib/pricing/catalog";

export type PfoAiModule = {
  sku: string;
  capabilityId: string;
  audience: "tutor" | "partner" | "clinic";
  purpose: string;
  professionalAct: boolean;
  blockedReason: string | null;
};

export const PFO_AI_MODULES: PfoAiModule[] = [
  { sku: "AI-T01", capabilityId: "concierge", audience: "tutor", purpose: "Concierge digital do tutor", professionalAct: false, blockedReason: null },
  { sku: "AI-T02", capabilityId: "care_navigator", audience: "tutor", purpose: "Navegação de cuidados", professionalAct: false, blockedReason: null },
  { sku: "AI-T03", capabilityId: "shopping_agent", audience: "tutor", purpose: "Agente de compras", professionalAct: false, blockedReason: null },
  { sku: "AI-T04", capabilityId: "routine_coach", audience: "tutor", purpose: "Coach de rotina", professionalAct: false, blockedReason: null },
  { sku: "AI-T05", capabilityId: "lost_pet", audience: "tutor", purpose: "Pet perdido", professionalAct: false, blockedReason: null },
  { sku: "AI-T06", capabilityId: "travel_agent", audience: "tutor", purpose: "Viagem pet", professionalAct: false, blockedReason: null },
  { sku: "AI-T07", capabilityId: "adoption_assistant", audience: "tutor", purpose: "Adoção (ONG patrocinada)", professionalAct: false, blockedReason: null },
  { sku: "AI-T08", capabilityId: "content_studio", audience: "tutor", purpose: "Estúdio de conteúdo", professionalAct: false, blockedReason: null },
  { sku: "AI-T09", capabilityId: "pfo.emergency_assistant", audience: "tutor", purpose: "Orientação de emergência informativa", professionalAct: false, blockedReason: null },
  { sku: "AI-T10", capabilityId: "pfo.report_organizer", audience: "tutor", purpose: "Organizar laudos existentes", professionalAct: false, blockedReason: null },
  { sku: "AI-T11", capabilityId: "pfo.medication_assistant", audience: "tutor", purpose: "Organizar medicamentos já prescritos", professionalAct: false, blockedReason: null },
  { sku: "AI-T12", capabilityId: "pfo.treatment_assistant", audience: "tutor", purpose: "Organizar plano de tratamento informado", professionalAct: false, blockedReason: null },
  { sku: "AI-T13", capabilityId: "pfo.exam_assistant", audience: "tutor", purpose: "Organizar exames enviados", professionalAct: false, blockedReason: null },
  { sku: "AI-T14", capabilityId: "pfo.multilingual_assistant", audience: "tutor", purpose: "Assistente multilíngue", professionalAct: false, blockedReason: null },
  { sku: "AI-P01", capabilityId: "sales_agent", audience: "partner", purpose: "Agente de vendas", professionalAct: false, blockedReason: null },
  { sku: "AI-P02", capabilityId: "crm_agent", audience: "partner", purpose: "CRM", professionalAct: false, blockedReason: null },
  { sku: "AI-P03", capabilityId: "catalog_agent", audience: "partner", purpose: "Catálogo", professionalAct: false, blockedReason: null },
  { sku: "AI-P04", capabilityId: "pricing_agent", audience: "partner", purpose: "Precificação assistida", professionalAct: false, blockedReason: null },
  { sku: "AI-P05", capabilityId: "inventory_agent", audience: "partner", purpose: "Estoque", professionalAct: false, blockedReason: null },
  { sku: "AI-P06", capabilityId: "service_capacity_agent", audience: "partner", purpose: "Capacidade de agenda", professionalAct: false, blockedReason: null },
  { sku: "AI-P07", capabilityId: "finance_agent", audience: "partner", purpose: "Financeiro do parceiro", professionalAct: false, blockedReason: null },
  { sku: "AI-P08", capabilityId: "ads_copilot", audience: "partner", purpose: "Copiloto de ads", professionalAct: false, blockedReason: null },
  { sku: "AI-P09", capabilityId: "support_agent_b2b", audience: "partner", purpose: "Suporte B2B", professionalAct: false, blockedReason: null },
  { sku: "AI-P10", capabilityId: "compliance_agent", audience: "partner", purpose: "Compliance operacional", professionalAct: false, blockedReason: null },
  { sku: "AI-P11", capabilityId: "pfo.billing_agent", audience: "partner", purpose: "Cobrança e conciliação", professionalAct: false, blockedReason: null },
  { sku: "AI-P12", capabilityId: "pfo.forecast_agent", audience: "partner", purpose: "Forecast e relatórios", professionalAct: false, blockedReason: null },
  { sku: "AI-P13", capabilityId: "pfo.winback_agent", audience: "partner", purpose: "Recuperação de clientes", professionalAct: false, blockedReason: null },
  { sku: "AI-P14", capabilityId: "pfo.reputation_agent", audience: "partner", purpose: "Reputação", professionalAct: false, blockedReason: null },
  { sku: "AI-C01", capabilityId: "pfo.clinical_transcription", audience: "clinic", purpose: "Transcrição assistiva", professionalAct: false, blockedReason: null },
  { sku: "AI-C02", capabilityId: "pfo.clinical_summary", audience: "clinic", purpose: "Resumo clínico assistivo", professionalAct: false, blockedReason: null },
  { sku: "AI-C03", capabilityId: "pfo.record_structuring", audience: "clinic", purpose: "Estruturar prontuário", professionalAct: false, blockedReason: null },
  { sku: "AI-C04", capabilityId: "pfo.radiology_assistive", audience: "clinic", purpose: "Pré-análise radiológica assistiva", professionalAct: false, blockedReason: null },
  {
    sku: "AI-C05",
    capabilityId: "pfo.radiology_human_review",
    audience: "clinic",
    purpose: "Revisão humana por radiologista",
    professionalAct: true,
    blockedReason: "Exige radiologista veterinário habilitado. Não é ato da OpenAI.",
  },
];

export function pfoAiModule(sku: string) {
  return PFO_AI_MODULES.find((m) => m.sku === sku);
}

export function pfoAiPurchasableCounts() {
  const rows = PFO_AI_MODULES.map((m) => OFFICIAL_CATALOG.find((c) => c.sku === m.sku));
  const purchasable = rows.filter((r) => r?.commercialAvailability === "PURCHASABLE").length;
  return { purchasable, total: PFO_AI_MODULES.length };
}
