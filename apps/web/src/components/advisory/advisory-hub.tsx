"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsCards } from "@/components/profile/shared/analytics-cards";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import {
  fetchAdvisoryDashboard,
  generateAdvisoryInsights,
  fetchAdvisoryMarketplace,
  type AdvisoryDashboard,
  type AdvisoryInsight,
} from "@/lib/advisory/api";
import { cn } from "@/lib/utils";

interface AdvisoryHubProps {
  variant: "partner" | "ngo";
}

export function AdvisoryHub({ variant }: AdvisoryHubProps) {
  const [dashboard, setDashboard] = useState<AdvisoryDashboard | null>(null);
  const [marketplace, setMarketplace] = useState<{ id: string; name: string; category: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const title = variant === "partner"
    ? "Assessoria Empresarial Inteligente"
    : "Assessoria Social Inteligente";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [dash, mkt] = await Promise.all([
        fetchAdvisoryDashboard(),
        fetchAdvisoryMarketplace(),
      ]);
      setDashboard(dash);
      setMarketplace(mkt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assessoria disponível apenas para Parceiros e ONGs autenticados");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateAdvisoryInsights();
      await load();
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="rounded-[16px] border p-8 text-center text-sm text-ecopet-gray">Carregando {title}...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-500">{error}</p>
          <p className="caption-text mt-2">Este módulo é exclusivo para perfis de Parceiro e ONG com assinatura ativa.</p>
        </CardContent>
      </Card>
    );
  }

  const insights: AdvisoryInsight[] = dashboard?.subscription.insights ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ecopet-green">{title}</h2>
          <p className="caption-text">IA · IoT · Robôs · Analytics · Dashboards</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {generating ? "Gerando..." : "Gerar insights IA"}
        </Button>
      </div>

      <AnalyticsCards
        items={(dashboard?.cards ?? []).map((c) => ({
          label: c.label,
          value: typeof c.value === "number" && c.value > 1000 ? c.value.toLocaleString("pt-BR") : String(c.value),
          trend: c.trend,
          icon: TrendingUp,
        }))}
        columns={4}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Central de Robôs de Assessoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(dashboard?.robots ?? []).map((robot) => (
              <div key={robot.domain} className="rounded-xl border border-ecopet-green/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{robot.name}</p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    robot.status === "online" ? "bg-ecopet-green/20 text-ecopet-green" : "bg-ecopet-gray/10 text-ecopet-gray"
                  )}>
                    {robot.status}
                  </span>
                </div>
                <p className="caption-text mt-1">{robot.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AIInsightsPanel
        insights={insights.map((i) => ({
          id: i.id,
          tag: i.category,
          title: i.title,
          description: i.description,
          priority: i.priority as "high" | "medium" | "low",
        }))}
        title="IA da Assessoria"
        subtitle="Problemas detectados, melhorias e planos de ação"
      />

      <Card>
        <CardHeader>
          <CardTitle>Marketplace — Assessoria ECOPET</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {marketplace.map((svc) => (
              <div key={svc.id} className="rounded-xl border p-4 hover:border-ecopet-green/40 transition-colors">
                <p className="text-xs text-ecopet-green font-semibold">{svc.category}</p>
                <p className="font-semibold mt-1">{svc.name}</p>
                <p className="text-ecopet-green font-bold mt-2">R$ {svc.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-ecopet-yellow/30 bg-ecopet-yellow/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-ecopet-yellow" />
          <p className="text-sm text-ecopet-gray">
            Monitoramento IoT, robôs físicos e drones integram-se via módulo de Integrações.
            A assessoria consolida dados operacionais, financeiros e de qualidade em tempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
