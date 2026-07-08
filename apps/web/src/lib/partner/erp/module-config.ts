import type { PartnerErpModuleId } from "@/lib/partner/erp/types";

export type PartnerErpModuleConfig = {
  id: PartnerErpModuleId;
  title: string;
  description: string;
};

export const PARTNER_ERP_MODULE_CONFIG: Record<PartnerErpModuleId, PartnerErpModuleConfig> = {
  dashboard: { id: "dashboard", title: "Dashboard Executivo", description: "Faturamento, metas e indicadores" },
  bi: { id: "bi", title: "Business Intelligence", description: "Tendências e previsões" },
  financeiro: { id: "financeiro", title: "Financeiro", description: "Fluxo de caixa e repasses" },
  contabil: { id: "contabil", title: "Contábil", description: "DRE, balanço e impostos" },
  comercial: { id: "comercial", title: "Comercial", description: "Metas e performance" },
  crm: { id: "crm", title: "CRM", description: "Leads, clientes e funil" },
  vendas: { id: "vendas", title: "Vendas", description: "Pipeline e conversão" },
  analytics: { id: "analytics", title: "Analytics", description: "LTV, CAC e churn" },
  marketplace: { id: "marketplace", title: "Marketplace", description: "Vitrine, estoque e avaliações" },
  rh: { id: "rh", title: "Recursos Humanos", description: "Colaboradores, férias e treinamentos" },
  juridico: { id: "juridico", title: "Jurídico", description: "Contratos, LGPD e termos" },
  administrativo: { id: "administrativo", title: "Administrativo", description: "Tarefas, processos e calendário" },
  compras: { id: "compras", title: "Compras", description: "Solicitações, cotações e aprovações" },
  fornecedores: { id: "fornecedores", title: "Fornecedores", description: "Cadastro, histórico e contratos" },
  permissoes: { id: "permissoes", title: "Permissões", description: "Papéis e matriz de acesso" },
  infraestrutura: { id: "infraestrutura", title: "Infraestrutura", description: "Unidades, salas e manutenção" },
  ti: { id: "ti", title: "TI", description: "Logs, backups, APIs e segurança" },
  equipamentos: { id: "equipamentos", title: "Equipamentos", description: "Computadores, impressoras e maquinário" },
  iot: { id: "iot", title: "IoT", description: "Sensores, balanças, coleiras e câmeras" },
  automacoes: { id: "automacoes", title: "Automações", description: "Workflows, lembretes e aprovações" },
  ia: { id: "ia", title: "Inteligência Artificial", description: "Assistentes especializados" },
  marketing: { id: "marketing", title: "Marketing", description: "Campanhas multicanal e ROI" },
  social: { id: "social", title: "Rede Social", description: "Perfil, posts e mensagens" },
  clientes: { id: "clientes", title: "Relacionamento", description: "Clientes, pets e histórico" },
  fidelidade: { id: "fidelidade", title: "Fidelização", description: "Pontos, cashback e cupons" },
  veterinario: { id: "veterinario", title: "Veterinário", description: "Prontuário, exames e vacinas" },
  loja: { id: "loja", title: "Loja Física", description: "Caixa, PDV e atendimento" },
  integracoes: { id: "integracoes", title: "Integrações", description: "Gateways e APIs externas" },
  laboratorio: { id: "laboratorio", title: "Laboratório", description: "Feature flags e A/B" },
  suporte: { id: "suporte", title: "Suporte", description: "Chamados e SLA" },
  parcerias: { id: "parcerias", title: "Parcerias", description: "ONGs parceiras e colaborações" },
};
