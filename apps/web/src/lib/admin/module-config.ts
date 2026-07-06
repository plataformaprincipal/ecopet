export type AdminModuleConfig = {
  id: string;
  title: string;
  description: string;
  apiEndpoint: string;
  erpModuleId?: string;
  gestorEndpoint?: string;
  exportType?: string;
  breadcrumbs?: { label: string; href?: string }[];
};

export const ADMIN_MODULES: Record<string, AdminModuleConfig> = {
  dashboard: {
    id: "dashboard",
    title: "Dashboard Executivo",
    description: "Visão executiva consolidada — KPIs, gráficos e insights em tempo real.",
    apiEndpoint: "dashboard",
    erpModuleId: "dashboard",
  },
  bi: {
    id: "bi",
    title: "Business Intelligence",
    description: "BI corporativo — receita, segmentação, previsões e anomalias.",
    apiEndpoint: "bi",
    erpModuleId: "bi",
  },
  financeiro: {
    id: "financeiro",
    title: "Financeiro ERP",
    description: "Contas a pagar/receber, fluxo de caixa, comissões e conciliação.",
    apiEndpoint: "finance",
    erpModuleId: "financeiro",
  },
  contabil: {
    id: "contabil",
    title: "Contabilidade",
    description: "DRE, balancete, lançamentos e exportação para contador.",
    apiEndpoint: "accounting",
    erpModuleId: "contabil",
  },
  controladoria: {
    id: "controladoria",
    title: "Controladoria",
    description: "Margem, EBITDA, ROI, forecast e orçamento vs realizado.",
    apiEndpoint: "controladoria",
    erpModuleId: "controladoria",
  },
  juridico: {
    id: "juridico",
    title: "Jurídico",
    description: "Contratos, LGPD, compliance e riscos jurídicos.",
    apiEndpoint: "legal",
    erpModuleId: "juridico",
  },
  rh: {
    id: "rh",
    title: "Recursos Humanos",
    description: "Colaboradores, departamentos, organograma e acessos.",
    apiEndpoint: "hr",
    erpModuleId: "rh",
  },
  ti: {
    id: "ti",
    title: "TI / Infraestrutura",
    description: "Saúde do sistema, logs, deploys e performance.",
    apiEndpoint: "it",
    erpModuleId: "ti",
  },
  ciberseguranca: {
    id: "ciberseguranca",
    title: "Cibersegurança",
    description: "Sessões, autenticação, bloqueios e auditoria de segurança.",
    apiEndpoint: "ciberseguranca",
    erpModuleId: "ciberseguranca",
  },
  inovacao: {
    id: "inovacao",
    title: "Inovação e IA",
    description: "Agentes, prompts e experimentos de IA.",
    apiEndpoint: "innovation",
    erpModuleId: "inovacao",
  },
  "ia-center": {
    id: "ia-center",
    title: "IA Center",
    description: "Modelos, agentes, custos, tokens e benchmarks de IA.",
    apiEndpoint: "innovation",
    erpModuleId: "ia-center",
  },
  marketing: {
    id: "marketing",
    title: "Marketing",
    description: "Campanhas, conversões, CAC e ROI de marketing.",
    apiEndpoint: "marketing",
    erpModuleId: "marketing",
  },
  administrativo: {
    id: "administrativo",
    title: "Administrativo",
    description: "Tarefas, processos e comunicados internos.",
    apiEndpoint: "administrative",
    erpModuleId: "administrativo",
  },
  permissoes: {
    id: "permissoes",
    title: "Acessos e Permissões",
    description: "RBAC, perfis e controle granular de acesso.",
    apiEndpoint: "permissions",
    erpModuleId: "permissoes",
  },
  laboratorio: {
    id: "laboratorio",
    title: "Laboratório",
    description: "Feature flags, A/B tests e experimentos controlados.",
    apiEndpoint: "laboratory",
    erpModuleId: "laboratorio",
  },
  comercial: {
    id: "comercial",
    title: "Comercial / CRM",
    description: "Pipeline, leads, propostas e funil de vendas.",
    apiEndpoint: "commercial",
    erpModuleId: "comercial",
  },
  crm: {
    id: "crm",
    title: "CRM",
    description: "Gestão de relacionamento com clientes e parceiros.",
    apiEndpoint: "commercial",
    erpModuleId: "crm",
  },
  tecnico: {
    id: "tecnico",
    title: "Técnico / Operações",
    description: "Suporte operacional, SLA e qualidade.",
    apiEndpoint: "technical",
    erpModuleId: "tecnico",
  },
  suporte: {
    id: "suporte",
    title: "Suporte",
    description: "Tickets, filas, SLA e base de conhecimento.",
    apiEndpoint: "support",
    erpModuleId: "suporte",
  },
  integracoes: {
    id: "integracoes",
    title: "Integrações",
    description: "Health check, webhooks, latência e logs de sync.",
    apiEndpoint: "integrations",
    erpModuleId: "integracoes",
  },
  analytics: {
    id: "analytics",
    title: "Analytics",
    description: "Eventos, coortes, retenção e métricas cross-módulo.",
    apiEndpoint: "analytics",
    erpModuleId: "analytics",
  },
  automacoes: {
    id: "automacoes",
    title: "Centro de Automações",
    description: "Workflows tipo Zapier — fluxos e execuções.",
    apiEndpoint: "automacoes",
    erpModuleId: "automacoes",
  },
  "data-center": {
    id: "data-center",
    title: "Data Center",
    description: "Importação, exportação, backups e governança de dados.",
    apiEndpoint: "data-center",
    erpModuleId: "data-center",
  },
  produto: {
    id: "produto",
    title: "Produto",
    description: "Roadmap, backlog, releases e feedback.",
    apiEndpoint: "produto",
    erpModuleId: "produto",
  },
  assistente: {
    id: "assistente",
    title: "Assistente Executivo IA",
    description: "Copiloto administrativo com respostas baseadas em dados reais.",
    apiEndpoint: "assistant",
    erpModuleId: "bi",
  },
  marketplace: {
    id: "marketplace",
    title: "Marketplace",
    description: "Produtos, estoque, pedidos e margem.",
    gestorEndpoint: "marketplace",
    apiEndpoint: "marketplace",
    erpModuleId: "marketplace",
    exportType: "products",
  },
  social: {
    id: "social",
    title: "Social / Comunidade",
    description: "Feed, engajamento e moderação.",
    gestorEndpoint: "social",
    apiEndpoint: "social",
    erpModuleId: "social",
  },
  audit: {
    id: "audit",
    title: "Auditoria / Logs",
    description: "Trilha de auditoria completa com exportação.",
    apiEndpoint: "audit",
    erpModuleId: "audit",
    exportType: "audit",
  },
  partners: {
    id: "partners",
    title: "Parceiros",
    description: "Gestão comercial e operacional de parceiros.",
    gestorEndpoint: "partners",
    apiEndpoint: "partners",
    erpModuleId: "partners",
    exportType: "partners",
  },
  ngos: {
    id: "ngos",
    title: "ONGs",
    description: "Organizações, adoções e campanhas.",
    gestorEndpoint: "ongs",
    apiEndpoint: "ngos",
    erpModuleId: "ngos",
    exportType: "ongs",
  },
};

export function getAdminModule(id: string): AdminModuleConfig | undefined {
  return ADMIN_MODULES[id];
}
