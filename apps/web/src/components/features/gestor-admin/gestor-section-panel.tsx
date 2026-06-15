"use client";

import { useCallback, useEffect, useState } from "react";
import { GestorHeader } from "./gestor-header";
import { MetricGrid } from "./metric-card";
import { FilterBar } from "./filter-bar";
import { DataTable } from "./data-table";
import { ExportButton } from "./export-button";
import { fetchGestorSection } from "@/lib/gestor/client-api";

type Props = {
  title: string;
  description?: string;
  endpoint: string;
  exportType?: string;
  showFilters?: boolean;
};

export function GestorSectionPanel({ title, description, endpoint, exportType, showFilters = true }: Props) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({ page: "1", limit: "20" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGestorSection(endpoint, filters);
      setData(result as Record<string, unknown>);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = (data?.metrics as { label: string; value: number }[] | undefined) ?? [];
  const items = (data?.items as Record<string, unknown>[] | undefined) ?? [];
  const alerts = (data?.alerts as { label: string; count: number; severity: string }[] | undefined);
  const integrations = data?.integrations as { name: string; status: string; message?: string }[] | undefined;
  const observability = data?.observability as { name: string; status: string }[] | undefined;
  const healthRows =
    data?.databaseConnected !== undefined
      ? [{ indicador: "Banco conectado", valor: data.databaseConnected ? "Sim" : "Não" }]
      : [];

  return (
    <>
      <GestorHeader title={title} description={description} />
      <div className="space-y-4 p-6">
        {showFilters && <FilterBar onFilter={(p) => setFilters((f) => ({ ...f, ...p }))} />}
        {exportType && <ExportButton reportType={exportType} filters={filters} />}
        {loading && <p className="text-sm text-muted-foreground">Carregando dados reais…</p>}
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && metrics.length > 0 && (
          <MetricGrid items={metrics.map((m) => ({ label: m.label, value: m.value }))} columns={4} />
        )}
        {alerts && (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.label} className="flex justify-between rounded-lg border bg-white px-4 py-3 text-sm dark:bg-white/5">
                <span>{a.label}</span>
                <span className="font-semibold">{a.count}</span>
              </li>
            ))}
          </ul>
        )}
        {healthRows.length > 0 && <DataTable rows={healthRows} />}
        {observability && observability.length > 0 && (
          <DataTable rows={observability.map((o) => ({ provedor: o.name, status: o.status }))} />
        )}
        {integrations && Array.isArray(integrations) && integrations.length > 0 && (
          <DataTable
            rows={integrations.map((i) => ({ nome: i.name, status: i.status, mensagem: i.message ?? "—" }))}
          />
        )}
        {items.length > 0 && <DataTable rows={items} />}
        {data?.disclaimer != null && (
          <p className="text-xs text-muted-foreground">{String(data.disclaimer)}</p>
        )}
        {!loading && !error && !items.length && !metrics.length && !alerts && !integrations && !observability && !healthRows.length && (
          <p className="text-sm text-muted-foreground">Sem dados no período — exibindo zero.</p>
        )}
      </div>
    </>
  );
}
