import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { buildAiInsights, pctChange } from "@/lib/admin/erp/enrich";

export type PartnerErpModuleId =
  | "dashboard"
  | "bi"
  | "financeiro"
  | "contabil"
  | "comercial"
  | "crm"
  | "vendas"
  | "analytics"
  | "marketplace"
  | "rh"
  | "juridico"
  | "administrativo"
  | "compras"
  | "fornecedores"
  | "permissoes"
  | "infraestrutura"
  | "ti"
  | "equipamentos"
  | "iot"
  | "automacoes"
  | "ia"
  | "marketing"
  | "social"
  | "clientes"
  | "fidelidade"
  | "veterinario"
  | "loja"
  | "integracoes"
  | "laboratorio"
  | "suporte"
  | "parcerias";

export const PARTNER_ERP_MODULES: Record<
  PartnerErpModuleId,
  { title: string; description: string }
> = {
  dashboard: { title: "Dashboard Executivo", description: "Visão geral do negócio" },
  bi: { title: "Business Intelligence", description: "Indicadores e tendências" },
  financeiro: { title: "Financeiro", description: "Fluxo de caixa e repasses" },
  contabil: { title: "Contábil", description: "DRE, balanço e impostos" },
  comercial: { title: "Comercial", description: "Metas e performance comercial" },
  crm: { title: "CRM", description: "Leads, clientes e funil" },
  vendas: { title: "Vendas", description: "Pipeline e conversão" },
  analytics: { title: "Analytics", description: "LTV, CAC, churn e crescimento" },
  marketplace: { title: "Marketplace", description: "Vendas, estoque e avaliações" },
  rh: { title: "Recursos Humanos", description: "Colaboradores e departamentos" },
  juridico: { title: "Jurídico", description: "Contratos, LGPD e compliance" },
  administrativo: { title: "Administrativo", description: "Tarefas e processos" },
  compras: { title: "Compras", description: "Solicitações e aprovações" },
  fornecedores: { title: "Fornecedores", description: "Cadastro e avaliação" },
  permissoes: { title: "Permissões", description: "Papéis e acessos" },
  infraestrutura: { title: "Infraestrutura", description: "Unidades, salas e manutenção" },
  ti: { title: "TI", description: "Usuários, logs, APIs e segurança" },
  equipamentos: { title: "Equipamentos", description: "Computadores, máquinas e câmeras" },
  iot: { title: "IoT", description: "Sensores, balanças e dispositivos" },
  automacoes: { title: "Automações", description: "Workflows e notificações" },
  ia: { title: "Inteligência Artificial", description: "Assistentes via Orchestrator" },
  marketing: { title: "Marketing", description: "Campanhas, e-mail, push e ROI" },
  social: { title: "Rede Social", description: "Perfil, posts e engajamento" },
  clientes: { title: "Relacionamento", description: "Histórico, pets e fidelidade" },
  fidelidade: { title: "Fidelização", description: "Pontos, cashback e assinaturas" },
  veterinario: { title: "Veterinário", description: "Prontuário, consultas e prescrições" },
  loja: { title: "Loja Física", description: "Caixa, PDV, filas e estoque" },
  integracoes: { title: "Integrações", description: "Pagamentos, mídia, envio e IA" },
  laboratorio: { title: "Laboratório", description: "Flags, testes e homologação" },
  suporte: { title: "Suporte", description: "Chamados e atendimento" },
  parcerias: { title: "Parcerias", description: "ONGs, campanhas e colaborações sociais" },
};

export { type ErpModuleResponse };

export function partnerInsights(growth?: number, moduleId?: string) {
  return buildAiInsights({ revenueGrowth: growth, moduleId });
}

export function kpi(key: string, label: string, value: number | string, extra?: Partial<{ delta: number; variant: "default" | "success" | "warning" | "critical" }>) {
  return { key, label, value, ...extra };
}

export function emptyModule(moduleId: PartnerErpModuleId, disclaimer?: string): ErpModuleResponse {
  const meta = PARTNER_ERP_MODULES[moduleId];
  return {
    moduleId,
    title: meta.title,
    kpis: [],
    charts: [],
    tables: [],
    items: [],
    alerts: [],
    aiInsights: [],
    disclaimer: disclaimer ?? "Sem dados no período. Os indicadores aparecerão quando houver movimentação real.",
  };
}

export { pctChange };
