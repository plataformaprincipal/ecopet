"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "./admin-page-header";
import { AdminMetricGrid } from "./admin-metric-card";
import { AdminDataTable } from "./admin-data-table";
import { AdminEmptyState } from "./admin-empty-state";
import { AdminTabs } from "./admin-tabs";
import { AdminAlert } from "../admin-alert";
import { FilterBar } from "@/components/features/gestor-admin/filter-bar";
import { ExportButton } from "@/components/features/gestor-admin/export-button";
import { fetchAdminModule, type AdminModuleResponse } from "@/lib/admin/client-api";
import { fetchGestorSection } from "@/lib/gestor/client-api";
import type { AdminModuleConfig } from "@/lib/admin/module-config";

type Props = {
  config: AdminModuleConfig;
};

export function AdminModulePanel({ config }: Props) {
  const [data, setData] = useState<AdminModuleResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ page: "1", limit: "20" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    try {
      let result: AdminModuleResponse;
      if (config.gestorEndpoint) {
        result = (await fetchGestorSection(config.gestorEndpoint, filters)) as AdminModuleResponse;
      } else {
        result = await fetchAdminModule(config.apiEndpoint, filters);
      }
      setData(result);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("403") || msg.toLowerCase().includes("permiss")) {
        setForbidden(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [config.apiEndpoint, config.gestorEndpoint, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (data?.tabs?.length && !activeTab) {
      setActiveTab(data.tabs[0].id);
    }
  }, [data?.tabs, activeTab]);

  const metrics = data?.metrics ?? [];
  const tabs = data?.tabs ?? [];
  const items = data?.items ?? [];
  const tables = data?.tables ?? [];
  const quickActions = data?.quickActions ?? [];
  const cashflow = data?.cashflow as Record<string, number> | undefined;
  const funnel = data?.funnel as { etapa: string; count: number }[] | undefined;
  const agents = data?.agents as { nome: string; status: string }[] | undefined;

  return (
    <>
      <AdminPageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: config.title }]}
      />
      <div className="space-y-4 p-4 sm:p-6">
        {config.exportType && <ExportButton reportType={config.exportType} filters={filters} />}
        <FilterBar onFilter={(p) => setFilters((f) => ({ ...f, ...p, page: "1" }))} />

        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando dados reais…
          </p>
        )}

        {forbidden && (
          <AdminEmptyState title="Permissão negada" description="Você não tem acesso a este módulo." />
        )}

        {error && !forbidden && <AdminAlert type="error" message={error} onDismiss={() => setError("")} />}

        {!loading && !error && !forbidden && metrics.length > 0 && (
          <AdminMetricGrid
            items={metrics.map((m) => ({
              label: m.label,
              value: typeof m.value === "number" && m.value > 9999 ? m.value.toLocaleString("pt-BR") : m.value,
            }))}
            columns={4}
          />
        )}

        {tabs.length > 0 && (
          <AdminTabs tabs={tabs} active={activeTab || tabs[0].id} onChange={setActiveTab} />
        )}

        {cashflow && activeTab === "cashflow" && (
          <AdminDataTable
            rows={Object.entries(cashflow).map(([k, v]) => ({
              indicador: k.replace(/([A-Z])/g, " $1"),
              valor: v,
            }))}
          />
        )}

        {funnel && (activeTab === "funnel" || !tabs.length) && (
          <AdminDataTable rows={funnel.map((f) => ({ etapa: f.etapa, quantidade: f.count }))} />
        )}

        {agents && activeTab === "agents" && (
          <AdminDataTable rows={agents.map((a) => ({ agente: a.nome, status: a.status }))} />
        )}

        {!loading && !error && !forbidden && items.length > 0 && (
          <AdminDataTable rows={items} />
        )}

        {!loading &&
          !error &&
          !forbidden &&
          tables.map((t) => (
            <section key={t.id}>
              <h2 className="mb-2 text-sm font-semibold">{t.label}</h2>
              <AdminDataTable rows={t.rows} />
            </section>
          ))}

        {!loading && !error && !forbidden && !items.length && !tables.length && !metrics.length && (
          <AdminEmptyState description="Nenhum registro no período selecionado." />
        )}

        {data?.disclaimer && (
          <p className="text-xs text-muted-foreground">{String(data.disclaimer)}</p>
        )}

        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-muted dark:bg-white/5"
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}

        {data?.pagination && (data.pagination as { pages: number }).pages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              disabled={filters.page === "1"}
              onClick={() => setFilters((f) => ({ ...f, page: String(Math.max(1, Number(f.page) - 1)) }))}
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              Página {filters.page} de {(data.pagination as { pages: number }).pages}
            </span>
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              disabled={Number(filters.page) >= (data.pagination as { pages: number }).pages}
              onClick={() => setFilters((f) => ({ ...f, page: String(Number(f.page) + 1) }))}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </>
  );
}
