"use client";

import { useEffect, useState } from "react";

type Metrics = {
  revenue: number;
  orders: number;
  avgTicket: number;
  executions: number;
  openaiCostUsd: number;
  estimatedMargin: number;
  failureRate: number;
  revenueBySku: Record<string, number>;
};

export function AdminAiMetricsPage() {
  const [m, setM] = useState<Metrics | null>(null);
  useEffect(() => {
    fetch("/api/admin/ai/commerce-metrics", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setM(d.data);
      });
  }, []);
  if (!m) return <p className="p-6 text-sm">Carregando…</p>;
  const cards = [
    ["Receita IA", `R$ ${m.revenue.toFixed(2)}`],
    ["Pedidos IA", String(m.orders)],
    ["Ticket médio", `R$ ${m.avgTicket.toFixed(2)}`],
    ["Utilizações", String(m.executions)],
    ["Custo OpenAI", `USD ${m.openaiCostUsd.toFixed(4)}`],
    ["Margem estimada", `R$ ${m.estimatedMargin.toFixed(2)}`],
    ["Taxa de falha", `${Math.round(m.failureRate * 100)}%`],
  ];
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Métricas EccoPet AI</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-lg font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-semibold">Receita por produto</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {Object.entries(m.revenueBySku).map(([sku, v]) => (
          <li key={sku}>
            {sku}: R$ {v.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
