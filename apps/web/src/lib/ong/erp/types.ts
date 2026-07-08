import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { buildAiInsights } from "@/lib/admin/erp/enrich";

export type NgoErpModuleId =
  | "dashboard"
  | "animais"
  | "adocoes"
  | "doacoes"
  | "campanhas"
  | "social"
  | "voluntariado"
  | "financeiro"
  | "administrativo"
  | "espaco-fisico"
  | "parcerias"
  | "marketing"
  | "automacoes"
  | "integracoes"
  | "ia"
  | "configuracoes";

export const NGO_ERP_MODULES: Record<NgoErpModuleId, { title: string; description: string }> = {
  dashboard: { title: "Dashboard ONG", description: "Indicadores e alertas da operação" },
  animais: { title: "Gestão de Animais", description: "Cadastro, saúde e status" },
  adocoes: { title: "Adoções", description: "Fluxo completo de adoção" },
  doacoes: { title: "Doações", description: "Financeiras, itens e recibos" },
  campanhas: { title: "Campanhas", description: "Arrecadação e emergências" },
  social: { title: "Rede Social", description: "Perfil, posts e engajamento" },
  voluntariado: { title: "Voluntariado", description: "Equipe e escalas" },
  financeiro: { title: "Financeiro", description: "Gastos e transparência" },
  administrativo: { title: "Administrativo", description: "Processos internos" },
  "espaco-fisico": { title: "Espaço Físico", description: "Abrigo, salas e capacidade" },
  parcerias: { title: "Parcerias", description: "Clínicas, petshops e fornecedores" },
  marketing: { title: "Marketing", description: "Divulgação e alcance" },
  automacoes: { title: "Automações", description: "Lembretes e workflows" },
  integracoes: { title: "Integrações", description: "Pagamentos, mídia e envio" },
  ia: { title: "Inteligência Artificial", description: "Assistentes via Orchestrator" },
  configuracoes: { title: "Configurações", description: "Perfil e preferências" },
};

export { type ErpModuleResponse };

export function ngoInsights(moduleId?: string) {
  return buildAiInsights({ moduleId });
}

export function kpi(
  key: string,
  label: string,
  value: number | string,
  extra?: Partial<{ delta: number; variant: "default" | "success" | "warning" | "critical" }>
) {
  return { key, label, value, ...extra };
}

export function emptyNgoModule(moduleId: NgoErpModuleId, disclaimer?: string): ErpModuleResponse {
  const meta = NGO_ERP_MODULES[moduleId];
  return {
    moduleId,
    title: meta.title,
    kpis: [],
    charts: [],
    tables: [],
    items: [],
    alerts: [],
    aiInsights: [],
    disclaimer: disclaimer ?? "Sem dados no período.",
  };
}
