"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IntegrationAIInsight } from "@/lib/integrations/types";
import { AI_AUTOMATION_INSIGHTS } from "@/lib/integrations/mock-data/logs.mock";

interface AIIntegrationInsightsProps {
  insights?: IntegrationAIInsight[];
}

export function AIIntegrationInsights({ insights = AI_AUTOMATION_INSIGHTS }: AIIntegrationInsightsProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="rounded-[16px] border border-ecopet-yellow/30 bg-gradient-to-br from-ecopet-yellow/5 to-ecopet-green/5 p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ecopet-yellow" />
            <h2 className="section-title">IA de Automação</h2>
            <Badge variant="premium">IA</Badge>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            Pedir análise da IA
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.slice(0, 4).map((i) => (
            <div key={i.id} className="rounded-xl border border-ecopet-gray/10 bg-white/80 p-3 dark:bg-ecopet-dark-card/80">
              <Badge variant={i.priority === "high" ? "premium" : "default"} className="mb-2 text-[10px]">{i.priority === "high" ? "Urgente" : i.priority === "medium" ? "Médio" : "Info"}</Badge>
              <h3 className="font-semibold text-sm">{i.title}</h3>
              <p className="caption-text mt-1">{i.description}</p>
              {i.action && <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">{i.action}</Button>}
            </div>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl dark:bg-ecopet-dark-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-ecopet-yellow" /> Análise IA</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-ecopet-green/5 p-4 text-sm">
                <p className="font-semibold">Resumo inteligente</p>
                <p className="mt-2 text-ecopet-gray dark:text-white/80">
                  12 integrações ativas, 2 com erro. 9 robôs operando 24h. 3 alertas críticos requerem atenção.
                  ERP Totvs offline impacta estoque. Recomenda-se reconexão imediata e campanha comercial para 23 clientes inativos.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-2">Recomendações prioritárias</p>
                <ul className="space-y-2">
                  {insights.filter((i) => i.priority === "high").map((i) => (
                    <li key={i.id} className="flex items-start gap-2 text-sm"><span className="text-ecopet-yellow">→</span>{i.title}: {i.description}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Próximos passos</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-ecopet-gray dark:text-white/80">
                  <li>Reconectar ERP Totvs</li>
                  <li>Aprovar campanha de reativação comercial</li>
                  <li>Revisar cobrança recorrente (inadimplência)</li>
                  <li>Conectar Shopee para expansão marketplace</li>
                </ol>
              </div>
              <Button className="w-full" onClick={() => setShowModal(false)}>Entendido</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
