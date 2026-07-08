"use client";

import { AdminAiSection } from "@/components/features/admin/admin-ai-section";

export default function AdminAiCostsPage() {
  return (
    <AdminAiSection
      title="Custos"
      description="Controle de tokens e custo estimado por modelo e usuário."
      endpoint="/api/ai/logs?admin=true&limit=50"
      render={(data) => {
        const costs = (data as { costs: { id: string; tokensInput: number; tokensOutput: number; estimatedCost: number; project: string | null; usageDate: string }[] }).costs ?? [];
        const stats = (data as { stats: { totalCostUsd: number; totalTokens: number } }).stats;
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border p-4 text-center">
                <p className="text-2xl font-bold">{stats?.totalTokens?.toLocaleString("pt-BR") ?? 0}</p>
                <p className="text-xs text-muted-foreground">Tokens totais</p>
              </div>
              <div className="rounded border p-4 text-center">
                <p className="text-2xl font-bold">US$ {(stats?.totalCostUsd ?? 0).toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">Custo estimado</p>
              </div>
            </div>
            <div className="space-y-2">
              {costs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro de custo ainda.</p>
              ) : (
                costs.map((c) => (
                  <div key={c.id} className="flex justify-between rounded border px-3 py-2 text-sm">
                    <span>{c.project ?? "—"} · {new Date(c.usageDate).toLocaleDateString("pt-BR")}</span>
                    <span className="text-muted-foreground">
                      {c.tokensInput + c.tokensOutput} tok · US$ {c.estimatedCost.toFixed(4)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
