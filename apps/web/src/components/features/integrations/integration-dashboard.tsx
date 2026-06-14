"use client";

import { Plug, Bot, AlertTriangle, Zap, RefreshCw, Database, Shield } from "lucide-react";
import { AnalyticsChartMock } from "@/components/features/profile/shared/analytics-chart-mock";
import { cn } from "@/lib/utils";
import type { IntegrationDashboardStats } from "@/lib/integrations/types";
import { SYNC_CHART, FAILURES_CHART, ROBOT_ACTIONS_CHART } from "@/lib/integrations/empty";

interface IntegrationDashboardProps {
  stats: IntegrationDashboardStats;
}

export function IntegrationDashboard({ stats }: IntegrationDashboardProps) {
  const cards = [
    { label: "Integrações ativas", value: stats.activeIntegrations, icon: Plug, color: "text-ecopet-green" },
    { label: "Com erro", value: stats.errorIntegrations, icon: AlertTriangle, color: "text-red-500" },
    { label: "Robôs ativos", value: stats.activeRobots, icon: Bot, color: "text-ecopet-yellow" },
    { label: "Alertas críticos", value: stats.criticalAlerts, icon: Shield, color: "text-amber-500" },
    { label: "Automações rodando", value: stats.runningAutomations, icon: Zap, color: "text-ecopet-green" },
    { label: "Última sync", value: stats.lastSync, icon: RefreshCw, color: "text-ecopet-gray" },
    { label: "Dados processados", value: stats.dataProcessed, icon: Database, color: "text-ecopet-green" },
    { label: "Riscos encontrados", value: stats.risksFound, icon: Shield, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-premium p-4">
            <c.icon className={cn("h-5 w-5 mb-2", c.color)} />
            <p className="font-display text-xl font-extrabold">{c.value}</p>
            <p className="caption-text">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsChartMock title="Sincronizações/dia" data={SYNC_CHART} />
        <AnalyticsChartMock title="Falhas por integração" data={FAILURES_CHART} />
        <AnalyticsChartMock title="Ações dos robôs/semana" data={ROBOT_ACTIONS_CHART} />
      </div>
    </div>
  );
}
