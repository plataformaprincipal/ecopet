"use client";

import { useState } from "react";
import { AnalyticsCards } from "@/components/profile/shared/analytics-cards";
import { AnalyticsChartMock } from "@/components/profile/shared/analytics-chart-mock";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { IntegrationMetricsPanel } from "./integration-metrics-panel";
import { ExternalMetricsCard } from "./external-metrics-card";
import { MOCK_INSIGHTS } from "@/lib/ecosystem/mock-data";
import { INSIGHTS_CHART_LINE, INSIGHTS_FUNNEL } from "@/lib/ecosystem/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Filter, Sparkles } from "lucide-react";

interface EcoPetInsightsDashboardProps {
  scope?: "network" | "partner" | "client" | "ngo";
}

export function EcoPetInsightsDashboard({ scope = "network" }: EcoPetInsightsDashboardProps) {
  const [period, setPeriod] = useState("7d");

  const cards = MOCK_INSIGHTS.map((m) => ({
    label: m.label,
    value: m.value,
    trend: m.trend,
  }));

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

      <AnalyticsCards items={cards} columns={4} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsChartMock title="Crescimento semanal" data={INSIGHTS_CHART_LINE} />
        <AnalyticsChartMock title="Funil de conversão" data={INSIGHTS_FUNNEL} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankingCard title="Produtos mais vistos" items={["Ração Premium Golden", "Shampoo Hipoalergênico", "Cama Ortopédica M"]} />
        <RankingCard title="Serviços mais contratados" items={["Banho & Tosa", "Consulta Veterinária", "Dog Walker"]} />
        <RankingCard title="Parceiros top" items={["Pet Shop Amigo", "Dr. Carlos Mendes", "ECOPET Store"]} />
      </div>

      <IntegrationMetricsPanel />

      <AIInsightsPanel
        title="IA de Insights ECOPET"
        subtitle="Resumo automático, detecção de quedas e oportunidades"
        insights={[
          { id: "ai1", tag: "Resumo", title: "Semana forte em conversões", description: "Vendas +22% vs semana anterior. Marketplace e WhatsApp lideram.", priority: "medium" },
          { id: "ai2", tag: "Oportunidade", title: "Campanha de banho & tosa", description: "Demanda alta detectada na região sul. Sugerimos promoção 15%.", priority: "high" },
          { id: "ai3", tag: "Alerta", title: "Queda no engajamento IG", description: "Stories -8% esta semana. Recomendamos 3 reels educativos.", priority: "medium" },
          { id: "ai4", tag: "Previsão", title: "Demanda ração premium", description: "Pico esperado em 10 dias com base em histórico sazonal.", priority: "low" },
        ]}
      />
    </div>
  );
}

function RankingCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card-premium rounded-[16px] border border-ecopet-gray/10 p-4">
      <h4 className="mb-3 flex items-center gap-2 font-semibold">
        <Sparkles className="h-4 w-4 text-ecopet-yellow" /> {title}
      </h4>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-2 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ecopet-green/10 text-xs font-bold text-ecopet-green">{i + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { ExternalMetricsCard, IntegrationMetricsPanel };
