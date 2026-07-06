/** Resposta padrão de módulos ERP/BI — dados reais, sem mocks. */
export type ErpKpi = {
  key: string;
  label: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  variant?: "default" | "success" | "warning" | "critical";
  drillDownHref?: string;
};

export type ErpChartPoint = { label: string; value: number; extra?: string };
export type ErpChartSeries = { name: string; points: ErpChartPoint[] };

export type ErpChart = {
  id: string;
  type: "line" | "bar" | "pie" | "funnel" | "heatmap" | "radar";
  title: string;
  series: ErpChartSeries[];
};

export type ErpTimelineEvent = {
  id: string;
  date: string;
  title: string;
  description?: string;
  actor?: string;
  severity?: "info" | "warning" | "critical";
  module?: string;
};

export type ErpAiInsight = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionHref?: string;
  metric?: string;
};

export type ErpAlert = {
  id: string;
  label: string;
  count: number;
  severity: "info" | "warning" | "critical";
  href?: string;
};

export type ErpWorkflowItem = {
  id: string;
  name: string;
  status: string;
  trigger: string;
  startedAt: string;
};

export type ErpModuleResponse = {
  moduleId: string;
  title?: string;
  kpis?: ErpKpi[];
  metrics?: ErpKpi[];
  charts?: ErpChart[];
  items?: Record<string, unknown>[];
  tables?: { id: string; label: string; rows: Record<string, unknown>[] }[];
  tabs?: { id: string; label: string }[];
  timeline?: ErpTimelineEvent[];
  aiInsights?: ErpAiInsight[];
  alerts?: ErpAlert[];
  workflows?: ErpWorkflowItem[];
  quickActions?: { label: string; href: string }[];
  pagination?: { page: number; limit: number; total: number; pages: number };
  disclaimer?: string;
  [key: string]: unknown;
};

export type ErpAssistantResponse = {
  answer: string;
  kpis?: ErpKpi[];
  charts?: ErpChart[];
  sources: string[];
  aiPowered: boolean;
};
