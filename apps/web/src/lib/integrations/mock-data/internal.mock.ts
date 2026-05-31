import type { InternalIntegration } from "../types";

export const INTERNAL_INTEGRATIONS: InternalIntegration[] = [
  { id: "int1", origin: "Perfil", destination: "Feed", sharedData: ["Posts", "Stories", "Seguidores"], status: "connected", activeAutomations: 3, riskLevel: "low", permissions: ["read", "write"] },
  { id: "int2", origin: "Perfil", destination: "Marketplace", sharedData: ["Compras", "Favoritos", "Carrinho"], status: "connected", activeAutomations: 5, riskLevel: "low", permissions: ["read", "write"] },
  { id: "int3", origin: "Perfil", destination: "Agenda", sharedData: ["Consultas", "Serviços", "Lembretes"], status: "connected", activeAutomations: 2, riskLevel: "low", permissions: ["read", "write"] },
  { id: "int4", origin: "Perfil", destination: "Notificações", sharedData: ["Alertas", "Push", "E-mail"], status: "connected", activeAutomations: 8, riskLevel: "low", permissions: ["read", "write"] },
  { id: "int5", origin: "Perfil", destination: "IA ECOPET", sharedData: ["Recomendações", "Insights", "Histórico"], status: "connected", activeAutomations: 12, riskLevel: "medium", permissions: ["read", "write", "ai"] },
  { id: "int6", origin: "Perfil", destination: "Financeiro", sharedData: ["Pagamentos", "Assinaturas", "Cashback"], status: "connected", activeAutomations: 4, riskLevel: "high", permissions: ["read", "write"] },
  { id: "int7", origin: "Perfil", destination: "Estoque", sharedData: ["SKUs", "Movimentações", "Alertas"], status: "connected", activeAutomations: 6, riskLevel: "medium", permissions: ["read", "write"] },
  { id: "int8", origin: "Perfil", destination: "Serviços", sharedData: ["Agendamentos", "Histórico", "Avaliações"], status: "connected", activeAutomations: 3, riskLevel: "low", permissions: ["read", "write"] },
  { id: "int9", origin: "Perfil", destination: "ECOPET Health", sharedData: ["Vacinas", "Prontuário", "Exames"], status: "connected", activeAutomations: 7, riskLevel: "high", permissions: ["read", "write", "health"] },
  { id: "int10", origin: "Perfil", destination: "AgroPet", sharedData: ["Produção", "IoT Rural", "Sensores"], status: "connected", activeAutomations: 4, riskLevel: "medium", permissions: ["read", "write"] },
  { id: "int11", origin: "Perfil", destination: "IoT ECOPET", sharedData: ["Dispositivos", "Alertas", "Métricas"], status: "connected", activeAutomations: 5, riskLevel: "medium", permissions: ["read", "write"] },
  { id: "int12", origin: "Perfil", destination: "Robôs 24h", sharedData: ["Automações", "Logs", "Alertas"], status: "connected", activeAutomations: 15, riskLevel: "medium", permissions: ["read", "write", "execute"] },
  { id: "int13", origin: "Perfil", destination: "BI & Analytics", sharedData: ["Métricas", "Relatórios", "Dashboards"], status: "connected", activeAutomations: 2, riskLevel: "low", permissions: ["read"] },
  { id: "int14", origin: "Perfil", destination: "Configurações", sharedData: ["Preferências", "Privacidade", "LGPD"], status: "connected", activeAutomations: 1, riskLevel: "high", permissions: ["read", "write"] },
  { id: "int15", origin: "Perfil", destination: "Acessibilidade", sharedData: ["Preferências VLibras", "Contraste"], status: "connected", activeAutomations: 0, riskLevel: "low", permissions: ["read"] },
];

export function getInternalForProfile(category: "CLIENT" | "PARTNER" | "NGO") {
  const clientDest = ["Feed", "Marketplace", "Agenda", "Notificações", "IA ECOPET", "Financeiro", "Serviços", "ECOPET Health", "IoT ECOPET", "Robôs 24h", "Configurações"];
  const ngoDest = ["Feed", "Notificações", "IA ECOPET", "Agenda", "Robôs 24h", "Configurações"];
  if (category === "CLIENT") return INTERNAL_INTEGRATIONS.filter((i) => clientDest.includes(i.destination));
  if (category === "NGO") return INTERNAL_INTEGRATIONS.filter((i) => ngoDest.includes(i.destination));
  return INTERNAL_INTEGRATIONS;
}
