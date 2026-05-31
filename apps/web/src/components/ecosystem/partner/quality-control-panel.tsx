"use client";

import { Shield, AlertTriangle, Star, TrendingUp, CheckCircle, Clock, RotateCcw, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCards } from "@/components/profile/shared/analytics-cards";
import { AIInsightsPanel } from "@/components/profile/shared/ai-insights-panel";
import { ProfileSection } from "@/components/profile/shared/smart-widgets";
import { MOCK_QUALITY } from "@/lib/ecosystem/mock-data";
import { cn } from "@/lib/utils";

export function QualityControlPanel() {
  const q = MOCK_QUALITY;

  const metrics = [
    { label: "Nota média", value: `${q.avgRating}★`, icon: Star, variant: "success" as const },
    { label: "Satisfação", value: `${q.satisfaction}%`, icon: TrendingUp },
    { label: "Taxa resposta", value: `${q.responseRate}%`, icon: MessageSquare },
    { label: "Conclusão", value: `${q.completionRate}%`, icon: CheckCircle },
    { label: "Reclamações", value: q.complaints, icon: AlertTriangle, variant: q.complaints > 5 ? "warning" as const : "default" as const },
    { label: "Devoluções", value: q.returns, icon: RotateCcw },
    { label: "Atrasos", value: q.delays, icon: Clock },
    { label: "Índice qualidade", value: `${q.qualityIndex}%`, icon: Shield, variant: "success" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="card-premium flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-ecopet-gray/10 p-5">
        <div>
          <p className="text-sm text-ecopet-gray">Índice geral de qualidade</p>
          <p className="font-display text-4xl font-extrabold text-ecopet-green">{q.qualityIndex}%</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {q.badges.map((b) => <Badge key={b} variant="verified">{b}</Badge>)}
          </div>
        </div>
        <div className={cn(
          "rounded-xl px-4 py-2 text-center text-sm font-semibold",
          q.operationalRisk === "low" ? "bg-emerald-500/10 text-emerald-700" :
          q.operationalRisk === "medium" ? "bg-amber-500/10 text-amber-700" : "bg-red-500/10 text-red-600"
        )}>
          Risco operacional: {q.operationalRisk === "low" ? "Baixo" : q.operationalRisk === "medium" ? "Médio" : "Alto"}
        </div>
      </div>

      <AnalyticsCards items={metrics} columns={4} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Qualidade por área">
          <div className="space-y-3">
            {[
              { label: "Atendimento", value: q.serviceQuality, max: 5 },
              { label: "Produtos", value: q.productQuality, max: 5 },
              { label: "Serviços", value: q.serviceQuality, max: 5 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}/{item.max}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ecopet-gray/10">
                  <div className="h-full rounded-full bg-ecopet-green" style={{ width: `${(item.value / item.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ProfileSection>

        <AIInsightsPanel
          title="Recomendações IA"
          insights={[
            { id: "q1", tag: "Qualidade", title: "Taxa de resposta excelente", description: "Mantenha tempo médio abaixo de 15 min.", priority: "low" },
            { id: "q2", tag: "Alerta", title: "1 auditoria pendente", description: "Conclua checklist de conformidade até sexta.", priority: "high" },
            { id: "q3", tag: "Melhoria", title: "Reduzir atrasos em entrega", description: "3 pedidos atrasaram na última semana.", priority: "medium" },
          ]}
        />
      </div>

      <ProfileSection title="Checklist de conformidade">
        <div className="space-y-2">
          {[
            { item: "Documentação verificada", ok: true },
            { item: "Políticas atualizadas", ok: true },
            { item: "Auditoria de estoque", ok: false },
            { item: "Treinamento equipe", ok: true },
          ].map((c) => (
            <div key={c.item} className="flex items-center gap-2 rounded-lg border border-ecopet-gray/10 px-3 py-2 text-sm">
              <CheckCircle className={cn("h-4 w-4", c.ok ? "text-emerald-500" : "text-ecopet-gray")} />
              <span className={c.ok ? "" : "text-ecopet-gray"}>{c.item}</span>
              {!c.ok && <Badge variant="secondary" className="ml-auto text-[10px]">Pendente</Badge>}
            </div>
          ))}
        </div>
      </ProfileSection>
    </div>
  );
}
