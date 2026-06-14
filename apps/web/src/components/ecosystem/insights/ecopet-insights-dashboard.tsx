"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { AnalyticsChartMock } from "@/components/profile/shared/analytics-chart-mock";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { IntegrationMetricsPanel } from "./integration-metrics-panel";
import { ExternalMetricsCard } from "./external-metrics-card";
import { INSIGHTS_CHART_LINE, INSIGHTS_FUNNEL } from "@/lib/ecosystem/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

interface EcoPetInsightsDashboardProps {
  scope?: "network" | "partner" | "client" | "ngo";
}

export function EcoPetInsightsDashboard({ scope = "network" }: EcoPetInsightsDashboardProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("7d");
  const cards: { label: string; value: string | number; trend?: string }[] = [];

  if (cards.length === 0 && INSIGHTS_CHART_LINE.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t("empty.admin.noData")}
        description={t("empty.admin.noData")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Métricas e Insights</h3>
          <p className="text-sm text-ecopet-gray">
            {scope === "network" ? "Rede ECOPET completa" : scope === "partner" ? "Seu negócio" : scope === "ngo" ? "Impacto social" : "Sua jornada"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["7d", "30d", "90d", "1y"].map((p) => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
              {p}
            </Button>
          ))}
          <Button size="sm" variant="outline"><Filter className="h-4 w-4" /> Filtros</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChartMock title="Crescimento semanal" data={INSIGHTS_CHART_LINE} />
        <AnalyticsChartMock title="Funil de conversão" data={INSIGHTS_FUNNEL} />
      </div>

      <IntegrationMetricsPanel />

      <AIInsightsPanel
        title="IA de Insights ECOPET"
        subtitle="Resumo automático, detecção de quedas e oportunidades"
        insights={[]}
      />
    </div>
  );
}

export { ExternalMetricsCard, IntegrationMetricsPanel };
