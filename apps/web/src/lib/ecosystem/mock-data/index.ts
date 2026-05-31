import type { CustomQuote, ChatConversation, ChatMessage, TeamMember, Supplier, QualityMetrics, InsightMetric } from "../types";

export const MOCK_QUOTES: CustomQuote[] = [
  {
    id: "qt1",
    name: "Reforma área de banho & tosa",
    description: "Instalação de box, piso antiderrapante e sistema de exaustão para área de banho do pet shop.",
    value: 12500,
    validUntil: "2026-06-15",
    executionDeadline: "2026-07-30",
    partnerId: "mp1",
    partnerName: "Pet Shop Amigo",
    partnerAvatar: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&q=80",
    clientId: "client1",
    clientName: "Maria Silva",
    issuedAt: "2026-05-20",
    status: "sent",
    includedItems: ["Mão de obra", "Materiais básicos", "Projeto técnico"],
    excludedItems: ["Mobiliário", "Equipamentos elétricos premium"],
    conditions: "Pagamento 50% na aprovação, 50% na entrega. Garantia 12 meses.",
    version: 1,
    history: [{ date: "2026-05-20", action: "Orçamento enviado", by: "Pet Shop Amigo" }],
  },
  {
    id: "qt2",
    name: "Plano de cuidados Luna — 3 meses",
    description: "Pacote personalizado: banho quinzenal, consulta mensal e suplementação.",
    value: 890,
    validUntil: "2026-05-30",
    executionDeadline: "2026-08-30",
    partnerId: "mp3",
    partnerName: "Dr. Carlos Mendes",
    partnerAvatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80",
    clientId: "client1",
    clientName: "Maria Silva",
    issuedAt: "2026-05-22",
    status: "accepted",
    includedItems: ["6 banhos", "3 consultas", "Omega 3 incluso"],
    excludedItems: ["Exames laboratoriais", "Medicamentos prescritos"],
    conditions: "Válido por 30 dias. Agendamento via ECOPET.",
    version: 2,
    history: [
      { date: "2026-05-22", action: "Enviado", by: "Dr. Carlos" },
      { date: "2026-05-23", action: "Aceito pelo cliente", by: "Maria Silva" },
    ],
  },
  {
    id: "qt3",
    name: "Campanha adoção — kit divulgação",
    description: "Design, posts e stories para campanha Mel (SRD).",
    value: 2400,
    validUntil: "2026-06-01",
    executionDeadline: "2026-06-15",
    partnerId: "mp5",
    partnerName: "ECOPET Store",
    partnerAvatar: "https://images.unsplash.com/photo-1589924691995-400dc9ecc392?w=200&q=80",
    clientId: "ngo1",
    clientName: "Amigos de 4 Patas",
    issuedAt: "2026-05-18",
    status: "negotiating",
    includedItems: ["10 posts", "5 stories", "1 reel"],
    excludedItems: ["Tráfego pago"],
    conditions: "Parceria social ECOPET — 20% desconto ONG.",
    version: 1,
  },
];

export const MOCK_CONVERSATIONS: ChatConversation[] = [
  { id: "c1", type: "custom_quote", title: "Orçamento banho & tosa personalizado", participantName: "Pet Shop Amigo", participantAvatar: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&q=80", participantRole: "partner", lastMessage: "Enviei o orçamento revisado. Confira!", lastMessageAt: "14:32", unread: 2, status: "open", quoteId: "qt1", tags: ["orçamento"] },
  { id: "c2", type: "product_inquiry", title: "Dúvida Ração Premium Golden", participantName: "ECOPET Store", participantAvatar: "https://images.unsplash.com/photo-1589924691995-400dc9ecc392?w=200&q=80", participantRole: "partner", lastMessage: "Sim, ideal para Golden adulto!", lastMessageAt: "Ontem", unread: 0, status: "resolved" },
  { id: "c3", type: "system_support", title: "Suporte ECOPET", participantName: "Sistema ECOPET", participantAvatar: "/brand/ecopet-symbol-source.png", participantRole: "system", lastMessage: "Como posso ajudar com seu pedido?", lastMessageAt: "10:15", unread: 1, status: "open" },
  { id: "c4", type: "adoption", title: "Interesse adoção Mel", participantName: "Amigos de 4 Patas", participantAvatar: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=80", participantRole: "ngo", lastMessage: "Podemos agendar visita sábado?", lastMessageAt: "09:00", unread: 0, status: "pending" },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", conversationId: "c1", senderId: "client1", senderName: "Maria Silva", senderRole: "client", content: "Preciso de um pacote de banho & tosa quinzenal para Luna, Golden 28kg.", type: "text", createdAt: "2026-05-20 10:00" },
    { id: "m2", conversationId: "c1", senderId: "mp1", senderName: "Pet Shop Amigo", senderRole: "partner", content: "Entendi! Vou preparar um orçamento personalizado com opções de horário.", type: "text", createdAt: "2026-05-20 10:15" },
    { id: "m3", conversationId: "c1", senderId: "mp1", senderName: "Pet Shop Amigo", senderRole: "partner", content: "Orçamento enviado", type: "quote", quote: MOCK_QUOTES[0], createdAt: "2026-05-20 14:00" },
    { id: "m4", conversationId: "c1", senderId: "client1", senderName: "Maria Silva", senderRole: "client", content: "Pode incluir tosa na máquina? Ajuste o valor por favor.", type: "text", createdAt: "2026-05-21 09:30" },
    { id: "m5", conversationId: "c1", senderId: "mp1", senderName: "Pet Shop Amigo", senderRole: "partner", content: "Enviei o orçamento revisado. Confira!", type: "text", createdAt: "2026-05-24 14:32" },
  ],
  c3: [
    { id: "m6", conversationId: "c3", senderId: "system", senderName: "ECOPET IA", senderRole: "ai", content: "Olá Maria! Sou o suporte ECOPET. Como posso ajudar?", type: "text", createdAt: "2026-05-24 10:00" },
    { id: "m7", conversationId: "c3", senderId: "client1", senderName: "Maria Silva", senderRole: "client", content: "Quero saber status do meu pedido #4521", type: "text", createdAt: "2026-05-24 10:15" },
  ],
};

export const MOCK_TEAM: TeamMember[] = [
  { id: "tm1", name: "João Operador", email: "joao@petshopamigo.com", role: "operator", sector: "Atendimento", status: "active", lastAccess: "Há 5 min", permissions: ["chat.view", "chat.create", "products.view"] },
  { id: "tm2", name: "Ana Gerente", email: "ana@petshopamigo.com", role: "manager", sector: "Comercial", status: "active", lastAccess: "Há 1h", permissions: ["sales.admin", "products.edit", "quotes.approve"] },
  { id: "tm3", name: "Carlos Admin", email: "carlos@petshopamigo.com", role: "admin", sector: "Administrativo", status: "active", lastAccess: "Ontem", permissions: ["*"] },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: "sup1", name: "Golden Pet Foods", category: "Ração", products: ["Ração Premium Golden 15kg", "Ração Filhote"], services: [], rating: 4.8, riskLevel: "low", contact: "comercial@golden.com", paymentTerms: "30 dias", aiNote: "Melhor custo-benefício" },
  { id: "sup2", name: "Distribuidora Pet SP", category: "Higiene", products: ["Shampoo Hipoalergênico"], services: [], rating: 4.2, riskLevel: "medium", contact: "(11) 3333-0000", paymentTerms: "15 dias", aiNote: "Atraso recorrente — monitorar" },
];

export const MOCK_QUALITY: QualityMetrics = {
  avgRating: 4.8,
  complaints: 3,
  returns: 2,
  delays: 5,
  cancellations: 1,
  satisfaction: 94,
  responseRate: 98,
  completionRate: 96,
  serviceQuality: 4.9,
  productQuality: 4.7,
  qualityIndex: 92,
  operationalRisk: "low",
  pendingAudits: 1,
  badges: ["Verificado", "Top Qualidade", "Resposta Rápida"],
};

export const MOCK_INSIGHTS: InsightMetric[] = [
  { id: "i1", label: "Alcance semanal", value: "45.2k", trend: "+12%", source: "internal" },
  { id: "i2", label: "Engajamento", value: "8.4%", trend: "+2.1pp", source: "instagram" },
  { id: "i3", label: "Conversões", value: 234, trend: "+18%", source: "internal" },
  { id: "i4", label: "Vendas", value: "R$ 145k", trend: "+22%", source: "internal" },
  { id: "i5", label: "Seguidores IG", value: "12.4k", trend: "+340", source: "instagram" },
  { id: "i6", label: "Conversas WA", value: 890, trend: "+15%", source: "whatsapp" },
  { id: "i7", label: "ROI campanhas", value: "320%", trend: "+45%", source: "internal" },
  { id: "i8", label: "Taxa resposta", value: "98%", trend: "+1pp", source: "whatsapp" },
];

export function getQuotesForClient(clientId = "client1") {
  return MOCK_QUOTES.filter((q) => q.clientId === clientId || clientId === "client1");
}

export function getQuoteById(id: string) {
  return MOCK_QUOTES.find((q) => q.id === id);
}

export function getConversationsForRole(role: "client" | "partner" | "ngo" | "system") {
  if (role === "system") return MOCK_CONVERSATIONS.filter((c) => c.type === "system_support");
  if (role === "ngo") return MOCK_CONVERSATIONS.filter((c) => c.participantRole === "ngo" || c.type === "adoption");
  if (role === "partner") return MOCK_CONVERSATIONS.filter((c) => c.participantRole === "partner" || c.participantRole === "client");
  return MOCK_CONVERSATIONS;
}
