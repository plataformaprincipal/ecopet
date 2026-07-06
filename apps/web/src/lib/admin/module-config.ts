export type AdminModuleConfig = {
  id: string;
  title: string;
  description: string;
  apiEndpoint: string;
  gestorEndpoint?: string;
  exportType?: string;
  breadcrumbs?: { label: string; href?: string }[];
};

export const ADMIN_MODULES: Record<string, AdminModuleConfig> = {
  financeiro: {
    id: "financeiro",
    title: "Financeiro",
    description: "Central de gestão financeira da EcoPet — pedidos, pagamentos e fluxo de caixa.",
    apiEndpoint: "finance",
  },
  contabil: {
    id: "contabil",
    title: "Contábil",
    description: "Receita fiscal, despesas e relatórios para contabilidade.",
    apiEndpoint: "accounting",
  },
  juridico: {
    id: "juridico",
    title: "Jurídico",
    description: "Contratos, LGPD, reclamações e riscos jurídicos.",
    apiEndpoint: "legal",
  },
  rh: {
    id: "rh",
    title: "Recursos Humanos",
    description: "Colaboradores, departamentos e acessos internos.",
    apiEndpoint: "hr",
  },
  ti: {
    id: "ti",
    title: "TI / Segurança",
    description: "Saúde do sistema, logs técnicos e monitoramento.",
    apiEndpoint: "it",
  },
  inovacao: {
    id: "inovacao",
    title: "Inovação e IA",
    description: "Agentes de IA, feature flags e custos estimados.",
    apiEndpoint: "innovation",
  },
  marketing: {
    id: "marketing",
    title: "Design e Marketing",
    description: "Campanhas, comunicação e métricas de crescimento.",
    apiEndpoint: "marketing",
  },
  administrativo: {
    id: "administrativo",
    title: "Administrativo",
    description: "Tarefas internas, processos e solicitações.",
    apiEndpoint: "administrative",
  },
  permissoes: {
    id: "permissoes",
    title: "Acessos e Permissões",
    description: "Administradores, perfis RBAC e controle de acesso.",
    apiEndpoint: "permissions",
  },
  laboratorio: {
    id: "laboratorio",
    title: "Laboratório do Sistema",
    description: "Feature flags e testes controlados — use com cautela em produção.",
    apiEndpoint: "laboratory",
  },
  comercial: {
    id: "comercial",
    title: "Comercial / Vendas",
    description: "Funil comercial, leads e propostas.",
    apiEndpoint: "commercial",
  },
  tecnico: {
    id: "tecnico",
    title: "Técnico / Operações",
    description: "Suporte, tickets, SLA e operação diária.",
    apiEndpoint: "technical",
  },
  integracoes: {
    id: "integracoes",
    title: "Integrações",
    description: "Status das integrações externas — chaves sempre mascaradas.",
    apiEndpoint: "integrations",
  },
  marketplace: {
    id: "marketplace",
    title: "Marketplace",
    description: "Produtos, serviços, pedidos e moderação.",
    gestorEndpoint: "marketplace",
    apiEndpoint: "marketplace",
    exportType: "products",
  },
  social: {
    id: "social",
    title: "Social / Comunidade",
    description: "Posts, comentários, denúncias e moderação.",
    gestorEndpoint: "social",
    apiEndpoint: "social",
  },
  audit: {
    id: "audit",
    title: "Auditoria / Logs",
    description: "Histórico de ações sensíveis com filtros e exportação.",
    apiEndpoint: "audit",
    exportType: "audit",
  },
  partners: {
    id: "partners",
    title: "Parceiros",
    description: "Gestão completa de parceiros comerciais.",
    gestorEndpoint: "partners",
    apiEndpoint: "partners",
    exportType: "partners",
  },
  ngos: {
    id: "ngos",
    title: "ONGs",
    description: "Organizações, adoções e campanhas.",
    gestorEndpoint: "ongs",
    apiEndpoint: "ngos",
    exportType: "ongs",
  },
};

export function getAdminModule(id: string): AdminModuleConfig | undefined {
  return ADMIN_MODULES[id];
}
