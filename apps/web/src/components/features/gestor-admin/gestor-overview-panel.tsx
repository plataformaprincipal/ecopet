"use client";

import { useEffect, useState } from "react";
import { GestorHeader } from "./gestor-header";
import { MetricGrid } from "./metric-card";
import { DataTable } from "./data-table";
import { fetchGestorSection } from "@/lib/gestor/client-api";

export function GestorOverviewPanel() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGestorSection("overview")
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError((e as Error).message));
  }, []);

  const metrics = (data?.metrics as { label: string; value: number }[] | undefined) ?? [];
  const usersByRole = (data?.usersByRole as { role: string; count: number }[] | undefined) ?? [];
  const ordersByStatus = (data?.ordersByStatus as { status: string; count: number }[] | undefined) ?? [];

  return (
    <>
      <GestorHeader
        title="Visão executiva"
        description="Métricas reais do PostgreSQL — sem simulação de crescimento ou receita."
      />
      <div className="space-y-6 p-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {metrics.length > 0 && (
          <MetricGrid items={metrics.map((m) => ({ label: m.label, value: m.value }))} columns={4} />
        )}
        {usersByRole.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Usuários por role</h2>
            <DataTable rows={usersByRole.map((r) => ({ role: r.role, total: r.count }))} />
          </section>
        )}
        {ordersByStatus.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Pedidos por status</h2>
            <DataTable rows={ordersByStatus.map((o) => ({ status: o.status, total: o.count }))} />
          </section>
        )}
        {data?.checkedAt != null && (
          <p className="text-xs text-muted-foreground">Última verificação: {String(data.checkedAt)}</p>
        )}
      </div>
    </>
  );
}
