import type { AutomationLog, IntegrationDashboardStats, IntegrationAIInsight } from "../types";
import type { ChartDataPoint } from "@/lib/profile/types";

export const AUTOMATION_LOGS: AutomationLog[] = [
  { id: "log1", date: "2026-05-24", time: "14:32", module: "Integrações", robot: "Robô de Integrações", integration: "WhatsApp Business", event: "Sincronização concluída", status: "success", actionTaken: "890 mensagens processadas", riskLevel: "low" },
  { id: "log2", date: "2026-05-24", time: "14:15", module: "Estoque", robot: "Robô de Estoque", event: "Alerta estoque baixo", status: "alert", actionTaken: "Notificação enviada", recommendation: "Repor Ração Golden", riskLevel: "medium" },
  { id: "log3", date: "2026-05-24", time: "13:58", module: "Integrações", integration: "ERP Totvs", event: "Falha de conexão", status: "error", actionTaken: "Retry agendado", recommendation: "Verificar credenciais API", riskLevel: "high" },
  { id: "log4", date: "2026-05-24", time: "13:45", module: "Financeiro", robot: "Robô Financeiro", event: "Inadimplência detectada", status: "alert", actionTaken: "Relatório gerado", recommendation: "Revisar cobrança recorrente", riskLevel: "high" },
  { id: "log5", date: "2026-05-24", time: "13:30", module: "Marketing", robot: "Robô de Marketing", event: "Campanha sugerida", status: "pending", actionTaken: "Aguardando aprovação", recommendation: "Aprovar campanha inativos", riskLevel: "low" },
  { id: "log6", date: "2026-05-24", time: "12:00", module: "Saúde", robot: "Robô de Saúde", event: "Vacina em dia", status: "success", actionTaken: "Registro atualizado", riskLevel: "low" },
  { id: "log7", date: "2026-05-24", time: "11:45", module: "Adoção", robot: "Robô de Adoção", event: "Entrevista agendada", status: "auto_action", actionTaken: "Notificação enviada ao interessado", riskLevel: "medium" },
  { id: "log8", date: "2026-05-24", time: "11:20", module: "Integrações", integration: "Instagram", event: "Post sincronizado", status: "success", actionTaken: "Feed atualizado", riskLevel: "low" },
  { id: "log9", date: "2026-05-24", time: "10:55", module: "Resgate", robot: "Robô de Resgate", event: "Urgência detectada", status: "human_review", actionTaken: "Escalado para equipe", recommendation: "Animal resgatado — exame 48h", riskLevel: "high" },
  { id: "log10", date: "2026-05-24", time: "10:30", module: "Agenda", robot: "Robô de Agenda", event: "Conflito de horário", status: "alert", actionTaken: "Sugestão de reagendamento", riskLevel: "medium" },
];

export const DASHBOARD_STATS: IntegrationDashboardStats = {
  activeIntegrations: 12,
  errorIntegrations: 2,
  activeRobots: 9,
  criticalAlerts: 3,
  runningAutomations: 24,
  lastSync: "Há 5 min",
  dataProcessed: "1.2M registros/dia",
  risksFound: 5,
};

export const SYNC_CHART: ChartDataPoint[] = [
  { label: "Seg", value: 890 },
  { label: "Ter", value: 920 },
  { label: "Qua", value: 1050 },
  { label: "Qui", value: 980 },
  { label: "Sex", value: 1120 },
  { label: "Sáb", value: 780 },
  { label: "Dom", value: 650 },
];

export const FAILURES_CHART: ChartDataPoint[] = [
  { label: "Instagram", value: 2, color: "bg-ecopet-green" },
  { label: "WhatsApp", value: 0, color: "bg-ecopet-green" },
  { label: "ERP Totvs", value: 8, color: "bg-red-500" },
  { label: "Mercado Livre", value: 1, color: "bg-ecopet-green" },
  { label: "ContaAzul", value: 3, color: "bg-amber-500" },
];

export const ROBOT_ACTIONS_CHART: ChartDataPoint[] = [
  { label: "Seg", value: 2340 },
  { label: "Ter", value: 2560 },
  { label: "Qua", value: 2890 },
  { label: "Qui", value: 2450 },
  { label: "Sex", value: 3120 },
  { label: "Sáb", value: 1890 },
  { label: "Dom", value: 1560 },
];

export const AI_AUTOMATION_INSIGHTS: IntegrationAIInsight[] = [
  { id: "ai1", title: "ERP Totvs offline", description: "Integração com erro há 2 dias. Estoque parcialmente dessincronizado.", priority: "high", action: "Reconectar" },
  { id: "ai2", title: "Automação sugerida", description: "Conectar Shopee para expandir marketplace pet — ROI estimado +8%.", priority: "medium", action: "Configurar" },
  { id: "ai3", title: "Robô Comercial", description: "23 clientes inativos identificados — campanha de reativação recomendada.", priority: "medium", action: "Ver lista" },
  { id: "ai4", title: "Risco financeiro", description: "Inadimplência subiu 0.3pp — revisar fluxo de cobrança automática.", priority: "high", action: "Analisar" },
  { id: "ai5", title: "Otimização sync", description: "Reduzir frequência Instagram para 15min economiza 12% de API calls.", priority: "low" },
];

export function getDashboardStatsForProfile(category: "CLIENT" | "PARTNER" | "NGO"): IntegrationDashboardStats {
  if (category === "CLIENT") {
    return { activeIntegrations: 6, errorIntegrations: 0, activeRobots: 7, criticalAlerts: 1, runningAutomations: 8, lastSync: "Há 12 min", dataProcessed: "45k registros/dia", risksFound: 1 };
  }
  if (category === "NGO") {
    return { activeIntegrations: 5, errorIntegrations: 0, activeRobots: 8, criticalAlerts: 2, runningAutomations: 12, lastSync: "Há 8 min", dataProcessed: "120k registros/dia", risksFound: 2 };
  }
  return DASHBOARD_STATS;
}
