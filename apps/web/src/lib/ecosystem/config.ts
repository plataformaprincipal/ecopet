export const PERMISSION_CATEGORIES = [
  { id: "financial", label: "Financeiro", permissions: [{ id: "financial", label: "Financeiro", actions: ["view", "create", "edit", "approve", "export"] as const }] },
  { id: "sales", label: "Vendas", permissions: [{ id: "sales", label: "Vendas", actions: ["view", "create", "edit", "approve"] as const }] },
  { id: "chat", label: "Chat", permissions: [{ id: "chat", label: "Atendimento", actions: ["view", "create", "edit", "admin"] as const }] },
  { id: "products", label: "Produtos", permissions: [{ id: "products", label: "Produtos", actions: ["view", "create", "edit", "delete"] as const }] },
  { id: "services", label: "Serviços", permissions: [{ id: "services", label: "Serviços", actions: ["view", "create", "edit", "delete"] as const }] },
  { id: "quality", label: "Qualidade", permissions: [{ id: "quality", label: "Controle de qualidade", actions: ["view", "configure"] as const }] },
  { id: "marketing", label: "Marketing", permissions: [{ id: "marketing", label: "Marketing", actions: ["view", "create", "edit", "approve"] as const }] },
  { id: "reports", label: "Relatórios", permissions: [{ id: "reports", label: "Relatórios", actions: ["view", "export"] as const }] },
];

export const INSIGHTS_CHART_LINE = [
  { label: "Sem 1", value: 8200 }, { label: "Sem 2", value: 9100 },
  { label: "Sem 3", value: 8800 }, { label: "Sem 4", value: 10500 },
];

export const INSIGHTS_FUNNEL = [
  { label: "Visitas", value: 45000 }, { label: "Cliques", value: 12000 },
  { label: "Leads", value: 3400 }, { label: "Conversões", value: 890 },
];
