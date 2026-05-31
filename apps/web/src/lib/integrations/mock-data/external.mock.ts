import type { ExternalIntegration } from "../types";

export const EXTERNAL_INTEGRATIONS: ExternalIntegration[] = [
  { id: "ext1", name: "Instagram", provider: "Meta", category: "social", description: "Publicações, stories e engajamento", status: "connected", lastSync: "Há 5 min", permissions: ["posts", "stories", "insights"], syncedData: ["Posts", "Seguidores", "Engajamento"], responsible: "Maria Silva", riskLevel: "low", eventsCount: 234 },
  { id: "ext2", name: "Facebook", provider: "Meta", category: "social", description: "Página e campanhas sociais", status: "connected", lastSync: "Há 12 min", permissions: ["page", "ads"], syncedData: ["Posts", "Campanhas"], responsible: "Equipe Marketing", riskLevel: "low" },
  { id: "ext3", name: "TikTok", provider: "ByteDance", category: "social", description: "Vídeos curtos e tendências", status: "pending", permissions: ["videos"], syncedData: [], responsible: "—", riskLevel: "medium" },
  { id: "ext4", name: "WhatsApp Business", provider: "Meta", category: "whatsapp", description: "Atendimento e notificações", status: "connected", lastSync: "Tempo real", permissions: ["messages", "templates"], syncedData: ["Conversas", "Templates"], responsible: "Suporte", riskLevel: "medium", eventsCount: 890 },
  { id: "ext5", name: "Mercado Livre", provider: "ML", category: "marketplaces", description: "Produtos e pedidos marketplace", status: "connected", lastSync: "Há 1h", permissions: ["products", "orders"], syncedData: ["SKUs", "Pedidos"], responsible: "ECOPET Store", riskLevel: "low" },
  { id: "ext6", name: "Shopee", provider: "Shopee", category: "marketplaces", description: "Marketplace pet", status: "disconnected", permissions: [], syncedData: [], responsible: "—", riskLevel: "low" },
  { id: "ext7", name: "Mercado Pago", provider: "MP", category: "payments", description: "Pagamentos e Pix", status: "connected", lastSync: "Tempo real", permissions: ["payments", "pix"], syncedData: ["Transações", "Assinaturas"], responsible: "Financeiro", riskLevel: "high", eventsCount: 1200 },
  { id: "ext8", name: "Stripe", provider: "Stripe", category: "payments", description: "Gateway internacional", status: "disconnected", permissions: [], syncedData: [], responsible: "—", riskLevel: "high" },
  { id: "ext9", name: "Google Calendar", provider: "Google", category: "agenda", description: "Sincronização de agenda", status: "connected", lastSync: "Há 30 min", permissions: ["calendar"], syncedData: ["Eventos", "Consultas"], responsible: "Agenda", riskLevel: "low" },
  { id: "ext10", name: "ContaAzul", provider: "ContaAzul", category: "accounting", description: "Sistema contábil", status: "connected", lastSync: "Há 2h", permissions: ["invoices", "taxes"], syncedData: ["NF-e", "Impostos"], responsible: "Contabilidade", riskLevel: "medium" },
  { id: "ext11", name: "ERP Totvs", provider: "Totvs", category: "erp", description: "ERP empresarial", status: "error", lastSync: "Há 2 dias", permissions: ["stock", "finance"], syncedData: ["Estoque parcial"], responsible: "TI", riskLevel: "high", eventsCount: 3 },
  { id: "ext12", name: "Meta Ads", provider: "Meta", category: "marketing", description: "Campanhas de anúncios", status: "connected", lastSync: "Há 15 min", permissions: ["ads", "analytics"], syncedData: ["Campanhas", "Leads"], responsible: "Marketing", riskLevel: "medium" },
  { id: "ext13", name: "Site ECOPET", provider: "ECOPET", category: "sites", description: "Site próprio e landing pages", status: "connected", lastSync: "Sync automático", permissions: ["content", "forms"], syncedData: ["Leads", "Formulários"], responsible: "TI", riskLevel: "low" },
  { id: "ext14", name: "IoT Hub", provider: "ECOPET", category: "iot", description: "Dispositivos e sensores", status: "connected", lastSync: "Tempo real", permissions: ["devices", "alerts"], syncedData: ["Sensores", "Alertas"], responsible: "Operações", riskLevel: "medium" },
];

export function getExternalForProfile(category: "CLIENT" | "PARTNER" | "NGO"): ExternalIntegration[] {
  if (category === "CLIENT") {
    return EXTERNAL_INTEGRATIONS.filter((i) =>
      ["social", "whatsapp", "agenda", "payments", "health", "iot"].includes(i.category)
    );
  }
  if (category === "NGO") {
    return EXTERNAL_INTEGRATIONS.filter((i) =>
      ["social", "whatsapp", "payments", "sites", "email"].includes(i.category)
    );
  }
  return EXTERNAL_INTEGRATIONS;
}
