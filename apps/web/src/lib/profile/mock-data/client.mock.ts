import type { ProfileInsight, WidgetItem, ChartDataPoint, ProfileListItem } from "../types";

export const CLIENT_SOCIAL_STATS = [
  { label: "Posts", value: 128 },
  { label: "Seguidores", value: "1.2k" },
  { label: "Seguindo", value: 340 },
  { label: "Curtidas", value: "8.4k" },
];

export const CLIENT_SOCIAL_FEED: ProfileListItem[] = [
  { label: "Feed pessoal", value: "24 posts este mês", href: "/inicio" },
  { label: "Stories", value: "3 ativos", href: "/reels" },
  { label: "Reels", value: "12 publicados", href: "/reels" },
  { label: "Comunidades", value: "Golden Lovers SP", badge: "Ativo" },
  { label: "Grupos", value: "5 grupos", badge: "2 novos" },
  { label: "Mensagens", value: "8 não lidas", href: "/mensagens" },
  { label: "Favoritos", value: "34 itens" },
  { label: "Compartilhamentos", value: "56 este mês" },
];

export const CLIENT_PETS = [
  {
    id: "pet1",
    name: "Luna",
    species: "Cão",
    breed: "Golden Retriever",
    age: "3 anos",
    weight: "28 kg",
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
    healthStatus: "Boa",
    qrCode: "ECOPET-LUNA-001",
  },
  {
    id: "pet2",
    name: "Thor",
    species: "Cão",
    breed: "SRD",
    age: "5 anos",
    weight: "12 kg",
    photo: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80",
    healthStatus: "Excelente",
    qrCode: "ECOPET-THOR-002",
  },
];

export const CLIENT_INTELLIGENT_WIDGETS: WidgetItem[] = [
  { id: "w1", label: "Bem-estar do pet", value: "92%", trend: "+3% esta semana", sublabel: "Luna" },
  { id: "w2", label: "Consumo mensal", value: "R$ 890", trend: "-12% vs mês anterior" },
  { id: "w3", label: "Assinaturas ativas", value: 2, sublabel: "Ração + Vermífugo" },
  { id: "w4", label: "Alertas de saúde", value: 1, trend: "Vacina em dia ✓" },
  { id: "w5", label: "Economia IA", value: "R$ 145", sublabel: "Cashback + cupons" },
  { id: "w6", label: "Hábitos", value: "8.5k passos/dia", sublabel: "Luna — atividade alta" },
];

export const CLIENT_AI_INSIGHTS: ProfileInsight[] = [
  { id: "i1", title: "Ração Premium Golden", description: "Continua ideal para Luna com base no peso e idade.", tag: "Produto", action: "Ver produto", href: "/marketplace/produto/prod1", priority: "medium" },
  { id: "i2", title: "Banho & Tosa recomendado", description: "Próximo banho em 5 dias — Pet Shop Amigo com 15% off.", tag: "Serviço", action: "Agendar", href: "/marketplace/servicos", priority: "high" },
  { id: "i3", title: "Resumo diário", description: "Luna caminhou 8.500 passos. Hidratação extra recomendada.", tag: "Rotina", priority: "low" },
  { id: "i4", title: "Tendência: alimentação natural", description: "Conteúdo educativo sobre transição gradual.", tag: "Conteúdo", href: "/explorar", action: "Explorar" },
];

export const CLIENT_FINANCIAL: ProfileListItem[] = [
  { label: "Saldo carteira", value: "R$ 234,50" },
  { label: "Cashback acumulado", value: "R$ 89,00" },
  { label: "Pontos ECOPET", value: "2.450 pts" },
  { label: "Assinaturas", value: "2 ativas — R$ 189/mês" },
  { label: "Gastos por pet — Luna", value: "R$ 620/mês" },
  { label: "Gastos por pet — Thor", value: "R$ 270/mês" },
  { label: "Última compra", value: "Ração Premium — R$ 189" },
  { label: "Cupons disponíveis", value: "3 cupons", badge: "Novo" },
];

export const CLIENT_SERVICES: ProfileListItem[] = [
  { label: "Banho & Tosa", value: "28/05 — Pet Shop Amigo", badge: "Agendado" },
  { label: "Consulta veterinária", value: "10/04 — Dr. Carlos", badge: "Concluído" },
  { label: "Dog Walker", value: "Seg/Qua/Sex — 14h", badge: "Recorrente" },
  { label: "Teleatendimento", value: "Disponível 24h", href: "/marketplace/servicos" },
  { label: "Hospedagem", value: "Nenhuma reserva" },
  { label: "Serviço personalizado", value: "1 proposta recebida", badge: "Novo" },
];

export const CLIENT_SETTINGS: ProfileListItem[] = [
  { label: "Privacidade", value: "Amigos e seguidores" },
  { label: "Segurança", value: "2FA ativado" },
  { label: "Dispositivos", value: "3 conectados" },
  { label: "Idioma", value: "Português (BR)" },
  { label: "Notificações", value: "Push + E-mail" },
  { label: "LGPD", value: "Consentimentos OK", badge: "Verificado" },
  { label: "Redes sociais", value: "Instagram conectado" },
  { label: "Acessibilidade", value: "Modo alto contraste off" },
];

export const CLIENT_PROFILE = {
  name: "Maria Silva",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  coverImage: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
  bio: "Amante de pets 🐾 | Tutora da Luna e Thor | Comunidade Golden Lovers",
  location: "São Paulo, SP",
  subtitle: "Cliente · Tutora",
  isVerified: true,
  isPremium: true,
  badges: ["Verificado", "Premium", "Tutor"],
  metrics: [
    { label: "Pets", value: 2 },
    { label: "Posts", value: 128 },
    { label: "Seguidores", value: "1.2k" },
    { label: "Pontos", value: "2.450" },
  ],
};

export const CLIENT_DIGITAL_LIFE = {
  timeline: [
    { date: "2026-05-24", event: "Post no feed — Luna no parque", type: "social" },
    { date: "2026-05-22", event: "Compra — Ração Premium Golden", type: "purchase" },
    { date: "2026-05-20", event: "Consulta — Dr. Carlos Mendes", type: "health" },
    { date: "2026-05-18", event: "Conquista — Tutor Premium desbloqueado", type: "achievement" },
  ],
  achievements: [
    { name: "Tutor Premium", desc: "100+ interações sociais", unlocked: true },
    { name: "Saúde em dia", desc: "Vacinas atualizadas", unlocked: true },
    { name: "Explorador", desc: "Visitou 10 categorias", unlocked: false },
  ],
  subscriptions: [
    { name: "Ração Premium — Luna", price: "R$ 189/mês", status: "Ativa" },
    { name: "Vermífugo recorrente", price: "R$ 45/mês", status: "Ativa" },
  ],
  rewards: { points: 2450, cashback: "R$ 89", level: "Gold" },
  activities: [
    { label: "Posts esta semana", value: 5 },
    { label: "Serviços utilizados", value: 3 },
    { label: "Produtos favoritos", value: 12 },
    { label: "Interações IA", value: 18 },
  ],
};

export const CLIENT_CHART_DATA: ChartDataPoint[] = [
  { label: "Jan", value: 720 },
  { label: "Fev", value: 680 },
  { label: "Mar", value: 890 },
  { label: "Abr", value: 820 },
  { label: "Mai", value: 890 },
  { label: "Jun", value: 760 },
];
