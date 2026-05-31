import type { PartnerSubtype } from "../types";
import type { ProfileInsight, WidgetItem, ChartDataPoint, ProfileListItem, IntegrationItem } from "../types";

export const PARTNER_EXECUTIVE_METRICS: WidgetItem[] = [
  { id: "m1", label: "Faturamento", value: "R$ 145.890", trend: "+18% vs mês anterior" },
  { id: "m2", label: "Vendas", value: 234, trend: "+12%" },
  { id: "m3", label: "Pedidos", value: 189, trend: "+8%" },
  { id: "m4", label: "Agendamentos", value: 56, trend: "+22%" },
  { id: "m5", label: "Ticket médio", value: "R$ 623", trend: "+5%" },
  { id: "m6", label: "Margem", value: "34%", trend: "+2pp" },
  { id: "m7", label: "Avaliações", value: "4.92 ★", trend: "+0.1" },
  { id: "m8", label: "Retenção", value: "78%", trend: "+4%" },
  { id: "m9", label: "ROI campanhas", value: "320%", trend: "+45%" },
  { id: "m10", label: "Assinaturas", value: 89, trend: "+15" },
  { id: "m11", label: "CAC", value: "R$ 42", trend: "-8%" },
  { id: "m12", label: "Produtividade", value: "94%", trend: "+3%" },
  { id: "m13", label: "Lucro", value: "R$ 49.740", trend: "+18%" },
  { id: "m14", label: "LTV", value: "R$ 2.890", trend: "+12%" },
  { id: "m15", label: "ROI", value: "320%", trend: "+45%" },
];

export const PARTNER_SALES_CHART: ChartDataPoint[] = [
  { label: "Jan", value: 98000, color: "bg-ecopet-green" },
  { label: "Fev", value: 112000, color: "bg-ecopet-green" },
  { label: "Mar", value: 105000, color: "bg-ecopet-green" },
  { label: "Abr", value: 128000, color: "bg-ecopet-green" },
  { label: "Mai", value: 145890, color: "bg-ecopet-yellow" },
  { label: "Jun", value: 138000, color: "bg-ecopet-green" },
];

export const PARTNER_FINANCIAL: ProfileListItem[] = [
  { label: "Fluxo de caixa", value: "R$ 89.450 positivo" },
  { label: "Recebimentos pendentes", value: "R$ 12.340" },
  { label: "Inadimplência", value: "2.1%", badge: "Baixo" },
  { label: "Assinaturas MRR", value: "R$ 23.890" },
  { label: "Despesas operacionais", value: "R$ 45.230" },
  { label: "Impostos estimados", value: "R$ 8.920" },
  { label: "Lucro líquido", value: "R$ 49.740", badge: "+18%" },
  { label: "Meta mensal", value: "87% atingida" },
];

export const PARTNER_ACCOUNTING: ProfileListItem[] = [
  { label: "Notas fiscais emitidas", value: "234 este mês" },
  { label: "Regime tributário", value: "Simples Nacional" },
  { label: "Obrigações pendentes", value: "1 — DAS maio", badge: "Urgente" },
  { label: "Calendário fiscal", value: "3 eventos próximos" },
  { label: "Integração contábil", value: "ContaAzul conectada", badge: "Sync" },
  { label: "Alertas fiscais", value: "2 alertas" },
];

export const PARTNER_LEGAL: ProfileListItem[] = [
  { label: "Contratos ativos", value: "12" },
  { label: "LGPD", value: "Compliance OK", badge: "Verificado" },
  { label: "Termos de uso", value: "Atualizado 2026" },
  { label: "Políticas marketplace", value: "Aprovadas" },
  { label: "Pendências jurídicas", value: "0", badge: "Limpo" },
  { label: "Assinaturas digitais", value: "8 pendentes" },
  { label: "Riscos identificados", value: "1 baixo" },
];

export const PARTNER_MARKETING: ProfileListItem[] = [
  { label: "Campanhas ativas", value: "4", badge: "2 IA" },
  { label: "Tráfego orgânico", value: "+34% este mês" },
  { label: "Posts agendados", value: "12" },
  { label: "Anúncios ativos", value: "3 — R$ 2.400/mês" },
  { label: "Leads captados", value: "456", badge: "+28%" },
  { label: "Conversão", value: "4.8%", badge: "+0.6pp" },
  { label: "Engajamento social", value: "12.4k interações" },
  { label: "SEO score", value: "87/100" },
];

export const PARTNER_STOCK: ProfileListItem[] = [
  { label: "SKUs ativos", value: "156" },
  { label: "Estoque baixo", value: "8 itens", badge: "Alerta" },
  { label: "Validade próxima", value: "3 produtos" },
  { label: "Entradas (mês)", value: "234 unidades" },
  { label: "Saídas (mês)", value: "189 unidades" },
  { label: "Perdas", value: "0.8%", badge: "Normal" },
  { label: "Fornecedores", value: "12 ativos" },
  { label: "Previsão IA", value: "Repor ração Golden em 5 dias" },
];

export const PARTNER_RH: ProfileListItem[] = [
  { label: "Equipe", value: "12 colaboradores" },
  { label: "Metas do mês", value: "78% concluídas" },
  { label: "Produtividade média", value: "94%" },
  { label: "Ponto", value: "100% regular" },
  { label: "Treinamentos", value: "2 em andamento" },
  { label: "Vagas abertas", value: "1 — Atendente" },
];

export const PARTNER_INTEGRATIONS: IntegrationItem[] = [
  { id: "int1", name: "Instagram", status: "connected", lastSync: "Há 5 min" },
  { id: "int2", name: "WhatsApp Business", status: "connected", lastSync: "Há 2 min" },
  { id: "int3", name: "TikTok", status: "pending", lastSync: "Aguardando auth" },
  { id: "int4", name: "Mercado Livre", status: "connected", lastSync: "Há 1h" },
  { id: "int5", name: "ContaAzul", status: "connected", lastSync: "Há 30 min" },
  { id: "int6", name: "ERP Totvs", status: "disconnected" },
  { id: "int7", name: "Gateway PagSeguro", status: "connected", lastSync: "Tempo real" },
  { id: "int8", name: "Site ECOPET", status: "connected", lastSync: "Sync automático" },
];

export const PARTNER_AI_INSIGHTS: ProfileInsight[] = [
  { id: "pa1", title: "Previsão de demanda", description: "Ração Premium Golden: repor 40 unidades até sexta.", tag: "Estoque", priority: "high", action: "Ver estoque" },
  { id: "pa2", title: "Campanha sugerida", description: "Promoção banho+tosa para clientes inativos há 30+ dias.", tag: "Marketing", priority: "medium", action: "Criar campanha" },
  { id: "pa3", title: "Ajuste de preço", description: "Omega 3 Pet pode subir 5% sem impacto na conversão.", tag: "Pricing", priority: "low" },
  { id: "pa4", title: "Risco detectado", description: "Inadimplência subiu 0.3pp — revisar cobrança recorrente.", tag: "Financeiro", priority: "high" },
  { id: "pa5", title: "Crescimento previsto", description: "Junho: +12% faturamento com tendência atual.", tag: "BI", priority: "medium" },
];

export const PARTNER_PROFILES: Record<PartnerSubtype, {
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  subtitle: string;
}> = {
  PETSHOP: {
    name: "Pet Shop Amigo",
    avatar: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&q=80",
    coverImage: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
    bio: "Produtos premium, banho & tosa e atendimento humanizado",
    location: "Vila Mariana, São Paulo — SP",
    subtitle: "Parceiro · Pet Shop",
  },
  VETERINARIAN: {
    name: "Dr. Carlos Mendes",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80",
    coverImage: "https://images.unsplash.com/photo-1628009368238-7bb8cfc3877f?w=800&q=80",
    bio: "15 anos · Dermatologia · Teleconsultas · CRMV SP-12345",
    location: "Pinheiros, São Paulo — SP",
    subtitle: "Parceiro · Veterinário",
  },
  CLINIC: {
    name: "VetCare Premium",
    avatar: "https://images.unsplash.com/photo-1628009368238-7bb8cfc3877f?w=200&q=80",
    coverImage: "https://images.unsplash.com/photo-1576092768241-f7220aef8962?w=800&q=80",
    bio: "Clínica 24h · Emergência, exames, cirurgias e internação",
    location: "Pinheiros, São Paulo — SP",
    subtitle: "Parceiro · Clínica Veterinária",
  },
  SELLER: {
    name: "ECOPET Store",
    avatar: "https://images.unsplash.com/photo-1589924691995-400dc9ecc392?w=200&q=80",
    coverImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    bio: "Loja oficial ECOPET · Frete grátis · Top Seller",
    location: "Nacional — Brasil",
    subtitle: "Parceiro · Seller / Loja",
  },
  SERVICE_PROVIDER: {
    name: "Dog Walker SP",
    avatar: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80",
    coverImage: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    bio: "Passeios, pet sitting e cuidados personalizados",
    location: "Zona Sul, São Paulo — SP",
    subtitle: "Parceiro · Prestador de Serviço",
  },
  COMPANY: { name: "ECOPET Corp", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80", coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80", bio: "Operações corporativas ECOPET", location: "São Paulo — SP", subtitle: "Parceiro · Empresa" },
  DISTRIBUTOR: { name: "Distribuidora Pet Brasil", avatar: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80", coverImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80", bio: "Distribuição nacional de produtos pet", location: "Guarulhos — SP", subtitle: "Parceiro · Distribuidor" },
  AGRO: { name: "AgroPet Fazendas", avatar: "https://images.unsplash.com/photo-1500595046743-be5eaf8a0b0a?w=200&q=80", coverImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80", bio: "Agro inteligente integrado ECOPET", location: "Interior — SP", subtitle: "Parceiro · Agro" },
  FRANCHISE: { name: "ECOPET Franquia SP", avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&q=80", coverImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80", bio: "Rede franqueada ECOPET", location: "Grande SP", subtitle: "Parceiro · Franquia" },
  MARKETPLACE: { name: "Marketplace Hub ECOPET", avatar: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80", coverImage: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&q=80", bio: "Hub central de parceiros marketplace", location: "Brasil", subtitle: "Parceiro · Marketplace" },
};

export const PARTNER_BI_CHARTS = {
  clients: [{ label: "Jan", value: 890 }, { label: "Fev", value: 920 }, { label: "Mar", value: 980 }, { label: "Abr", value: 1050 }, { label: "Mai", value: 1120 }, { label: "Jun", value: 1180 }] as ChartDataPoint[],
  satisfaction: [{ label: "Jan", value: 4.7 }, { label: "Fev", value: 4.8 }, { label: "Mar", value: 4.85 }, { label: "Abr", value: 4.88 }, { label: "Mai", value: 4.92 }, { label: "Jun", value: 4.92 }] as ChartDataPoint[],
  churn: [{ label: "Jan", value: 8 }, { label: "Fev", value: 7 }, { label: "Mar", value: 6 }, { label: "Abr", value: 5.5 }, { label: "Mai", value: 4.8 }, { label: "Jun", value: 4.2 }] as ChartDataPoint[],
};
