import type { ProfileInsight, WidgetItem, ProfileListItem } from "../types";

export const NGO_PROFILE = {
  name: "Amigos de 4 Patas",
  avatar: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=80",
  coverImage: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
  bio: "Resgate, adoção responsável, campanhas e transparência total",
  location: "São Paulo, SP",
  subtitle: "ONG · Protetor Animal",
  isVerified: true,
  isPremium: false,
  badges: ["Verificado", "ONG", "Transparência"],
  metrics: [
    { label: "Adoções", value: 340 },
    { label: "Resgates", value: 89 },
    { label: "Voluntários", value: 24 },
    { label: "Arrecadado", value: "R$ 45k" },
  ],
};

export const NGO_SOCIAL: ProfileListItem[] = [
  { label: "Feed institucional", value: "48 posts", href: "/inicio" },
  { label: "Campanhas ativas", value: "2", badge: "Urgente" },
  { label: "Adoções publicadas", value: "12 animais" },
  { label: "Eventos", value: "Feira de adoção — 15/06" },
  { label: "Voluntários engajados", value: "24 ativos" },
  { label: "Stories", value: "5 ativos" },
  { label: "Reels", value: "18 publicados", href: "/reels" },
  { label: "Doações via feed", value: "R$ 3.450 este mês" },
];

export const NGO_RESCUE: ProfileListItem[] = [
  { label: "Animais resgatados (mês)", value: "8", badge: "3 urgentes" },
  { label: "Em triagem", value: "4" },
  { label: "Lares temporários", value: "6" },
  { label: "Prontos para adoção", value: "12" },
  { label: "Em tratamento", value: "5", badge: "Saúde" },
  { label: "Urgências ativas", value: "2", badge: "Crítico" },
  { label: "IA risco alto", value: "1 animal — Mel", badge: "IA" },
  { label: "Histórico resgates 2026", value: "34 animais" },
];

export const NGO_DONATIONS: ProfileListItem[] = [
  { label: "Meta mensal", value: "R$ 15.000 — 78% atingido" },
  { label: "Arrecadado (mês)", value: "R$ 11.700" },
  { label: "Doadores únicos", value: "156" },
  { label: "Doações recorrentes", value: "34 — R$ 4.200/mês" },
  { label: "PIX", value: "Ativo — amigos4patas@ecopet" },
  { label: "Transparência", value: "Relatório publicado", badge: "100%" },
  { label: "Campanha urgente", value: "Cirurgia Mel — R$ 2.800", badge: "68%" },
];

export const NGO_OPERATIONS: ProfileListItem[] = [
  { label: "Voluntários", value: "24 ativos / 8 escalados hoje" },
  { label: "Equipe fixa", value: "4 colaboradores" },
  { label: "Agenda visitas", value: "6 esta semana" },
  { label: "Adoções pendentes", value: "3 entrevistas" },
  { label: "Documentos", value: "100% regularizados" },
  { label: "Triagem", value: "4 animais aguardando" },
  { label: "Processos", value: "12 etapas padronizadas" },
];

export const NGO_AI_INSIGHTS: ProfileInsight[] = [
  { id: "na1", title: "Campanha inteligente", description: "Divulgar Mel (SRD) em stories — maior taxa de adoção para perfil similar.", tag: "Adoção", priority: "high", action: "Criar campanha" },
  { id: "na2", title: "Previsão de doações", description: "Campanha cirurgia Mel pode atingir meta em 4 dias.", tag: "Doações", priority: "medium" },
  { id: "na3", title: "Urgência detectada", description: "Animal resgatado ontem precisa exame em 48h.", tag: "Resgate", priority: "high" },
  { id: "na4", title: "Engajamento", description: "Posts com antes/depois geram 3x mais compartilhamentos.", tag: "Social", priority: "low" },
];

export const NGO_IMPACT = {
  adoptions2026: 34,
  livesSaved: 89,
  donationsTotal: "R$ 145.000",
  volunteersHours: 1240,
  transparencyScore: "100%",
  reports: [
    { title: "Relatório Maio 2026", status: "Publicado", date: "2026-05-01" },
    { title: "Prestação de contas Q1", status: "Publicado", date: "2026-04-15" },
  ],
};

export const NGO_WIDGETS: WidgetItem[] = [
  { id: "nw1", label: "Adoções (mês)", value: 8, trend: "+2 vs anterior" },
  { id: "nw2", label: "Resgates urgentes", value: 2, trend: "Ação imediata" },
  { id: "nw3", label: "Meta doações", value: "78%", sublabel: "R$ 11.700 / R$ 15.000" },
  { id: "nw4", label: "Voluntários hoje", value: 8, sublabel: "6 confirmados" },
];
