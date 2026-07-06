"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminMetricGrid } from "./ui/admin-metric-card";
import { AdminDataTable } from "./ui/admin-data-table";
import { AdminAlert } from "./admin-alert";
import { fetchAdminModule } from "@/lib/admin/client-api";

export function AdminDashboardPanel() {
  const [data, setData] = useState<{
    metrics: { key: string; label: string; value: number }[];
    tables?: { id: string; label: string; rows: Record<string, unknown>[] }[];
    quickActions?: { label: string; href: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminModule("dashboard");
      setData(result as typeof data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AdminPageHeader
        title="Dashboard Executivo"
        description="Visão geral da empresa — dados em tempo real do banco."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Dashboard" }]}
      />
      <div className="space-y-6 p-4 sm:p-6">
        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando métricas…
          </p>
        )}
        {error && <AdminAlert type="error" message={error} onDismiss={() => setError("")} />}

        {!loading && !error && data?.metrics && data.metrics.length > 0 && (
          <AdminMetricGrid
            items={data.metrics.map((m) => ({
              label: m.label,
              value: typeof m.value === "number" && m.value > 9999 ? m.value.toLocaleString("pt-BR") : m.value,
            }))}
            columns={4}
          />
        )}

        {data?.quickActions && data.quickActions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green dark:bg-white/5"
              >
                <span className="font-semibold">{a.label}</span>
              </Link>
            ))}
          </div>
        )}

        {data?.tables?.map((table) => (
          <section key={table.id}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {table.label}
            </h2>
            <AdminDataTable rows={table.rows} emptyLabel="Sem registros." />
          </section>
        ))}
      </div>
    </>
  );
}
