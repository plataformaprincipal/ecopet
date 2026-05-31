export const AGRO_IMAGES = {
  farm: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  field: "https://images.unsplash.com/photo-1625246333195-78d9c090ad70?w=800&q=80",
  drone: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80",
  robot: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80",
  tractor: "https://images.unsplash.com/photo-1592982537447-7447730cbfc9?w=600&q=80",
  cattle: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80",
  sensor: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  harvest: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80",
  soil: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  marketplace: "https://images.unsplash.com/photo-1625246333195-78d9c090ad70?w=600&q=80",
};

export const AGRO_NAV = [
  { href: "/agro", label: "Início", icon: "Home" },
  { href: "/agro/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/agro/fazendas", label: "Fazendas", icon: "MapPin" },
  { href: "/agro/monitoramento", label: "Monitoramento", icon: "Radio" },
  { href: "/agro/iot", label: "IoT", icon: "Cpu" },
  { href: "/agro/robos", label: "Robôs", icon: "Bot" },
  { href: "/agro/drones", label: "Drones", icon: "Plane" },
  { href: "/agro/ia", label: "IA Agro", icon: "Sparkles" },
  { href: "/agro/analises", label: "Análises", icon: "BarChart3" },
  { href: "/agro/producao", label: "Produção", icon: "TrendingUp" },
  { href: "/agro/plantio", label: "Plantio", icon: "Sprout" },
  { href: "/agro/colheita", label: "Colheita", icon: "Wheat" },
  { href: "/agro/solo", label: "Solo", icon: "Layers" },
  { href: "/agro/clima", label: "Clima", icon: "CloudSun" },
  { href: "/agro/rebanho", label: "Rebanho", icon: "Beef" },
  { href: "/agro/maquinas", label: "Máquinas", icon: "Tractor" },
  { href: "/agro/estoque", label: "Estoque", icon: "Package" },
  { href: "/agro/alertas", label: "Alertas", icon: "AlertTriangle" },
  { href: "/agro/marketplace", label: "Marketplace", icon: "ShoppingCart" },
] as const;

export const AGRO_SUB_NAV = AGRO_NAV.filter((n) =>
  ["/agro", "/agro/dashboard", "/agro/monitoramento", "/agro/ia", "/agro/fazendas", "/agro/alertas", "/agro/marketplace"].includes(n.href)
);

export const ROBOT_TYPES = [
  "Robô de plantio", "Robô de colheita", "Robô pulverizador", "Robô de irrigação",
  "Robô de inspeção", "Robô de capina", "Robô de ordenha", "Robô alimentador",
  "Robô de limpeza", "Robô monitoramento animal", "Robô entrega interna",
];

export const IOT_TYPES = [
  "Sensor de solo", "Sensor climático", "Sensor de irrigação", "Coleira inteligente",
  "Câmera inteligente", "Balança inteligente", "Sensor de silo", "Sensor de combustível",
  "Sensor de máquina", "Estação meteorológica", "Sensor de cerca",
];

export const ML_MODEL_LABELS: Record<string, string> = {
  productivity: "Modelo de produtividade",
  irrigation: "Modelo de irrigação",
  pests: "Modelo de pragas",
  costs: "Modelo de custos",
  demand: "Modelo de demanda",
  animal_health: "Modelo de saúde animal",
};

export const AI_QUICK_QUESTIONS = [
  "Qual área tem maior risco de praga?",
  "Quando devo irrigar?",
  "Qual talhão está com baixa produtividade?",
  "Qual previsão de colheita?",
  "Quais máquinas estão paradas?",
  "Como reduzir custo por hectare?",
];

export const AI_MOCK_RESPONSES: Record<string, string> = {
  "Qual área tem maior risco de praga?": "O Talhão B2 (Soja) apresenta risco alto de lagarta-do-cartucho. NDVI caiu 8% nos últimos 3 dias. Recomendo inspeção com drone DJI-Agro 02 e pulverização preventiva em 48h.",
  "Quando devo irrigar?": "Com base na umidade do solo (32%) e previsão de seca, recomendo irrigação no Talhão A1 amanhã entre 5h-7h. Economia estimada de 12% vs. irrigação noturna.",
  "Qual talhão está com baixa produtividade?": "Talhão C3 (Milho) está 18% abaixo da média histórica. Solo com baixo nitrogênio (N: 12 ppm). Sugestão: adubação nitrogenada + análise complementar.",
  "Qual previsão de colheita?": "Safra 2026: Soja 42 sc/ha (±3), Milho 98 sc/ha (±5). Janela ideal de colheita: 15-28 de junho. Perdas estimadas: 2.1% se colher no período.",
  "Quais máquinas estão paradas?": "2 máquinas paradas: Pulverizador PX-400 (manutenção programada) e Caminhão GR-120 (falha no sistema hidráulico — manutenção preditiva acionada).",
  "Como reduzir custo por hectare?": "Oportunidades: (1) otimizar rotas do robô pulverizador (-R$45/ha), (2) compra coletiva de defensivos (-8%), (3) irrigação inteligente (-R$32/ha em água).",
};

export function formatAgroCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatHa(value: number) {
  return `${value.toLocaleString("pt-BR")} ha`;
}
