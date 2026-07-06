"use client";

import Link from "next/link";
import type { ErpAiInsight, ErpAlert, ErpKpi, ErpModuleResponse, ErpTimelineEvent } from "@/lib/admin/erp/types";
import { AdminPageHeader } from "../ui/admin-page-header";
import { AdminMetricGrid } from "../ui/admin-metric-card";
import { AdminDataTable } from "../ui/admin-data-table";
import { AdminEmptyState } from "../ui/admin-empty-state";
import { AdminTabs } from "../ui/admin-tabs";
import { AdminAlert } from "../admin-alert";
import { FilterBar } from "@/components/features/gestor-admin/filter-bar";
import { ErpChartView } from "./erp-charts";
import { ErpExportBar } from "./erp-export-bar";
import { ErpAiPanel } from "./erp-ai-panel";
import { Brain, AlertTriangle, History, Workflow, LayoutDashboard, Table2 } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  moduleId: string;
  data: ErpModuleResponse | null;
  loading: boolean;
  error: string;
  forbidden: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFilter: (params: Record<string, string>) => void;
};

const SHELL_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "data", label: "Dados", icon: Table2 },
  { id: "history", label: "Histórico", icon: History },
  { id: "ai", label: "IA", icon: Brain },
  { id: "workflows", label: "Workflows", icon: Workflow },
];

export function AdminErpShell({
  title,
  description,
  moduleId,
  data,
  loading,
  error,
  forbidden,
  activeTab,
  onTabChange,
  onFilter,
}: Props) {
  const kpis = data?.kpis ?? data?.metrics ?? [];
  const charts = data?.charts ?? [];
  const items = data?.items ?? [];
  const timeline = data?.timeline ?? [];
  const aiInsights = data?.aiInsights ?? [];
  const alerts = data?.alerts ?? [];
  const workflows = data?.workflows ?? [];
  const moduleTabs = data?.tabs ?? [];

  const displayTabs =
    moduleTabs.length > 0 && activeTab !== "dashboard" && activeTab !== "data" && activeTab !== "history" && activeTab !== "ai" && activeTab !== "workflows"
      ? moduleTabs
      : SHELL_TABS.map((t) => ({ id: t.id, label: t.label }));

  return (
    <>
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: title }]}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar onFilter={(p) => onFilter(p as Record<string, string>)} />
          {data && <ErpExportBar moduleId={moduleId} title={title} data={data} />}
        </div>

        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {alerts.map((a: ErpAlert) => (
              <Link
                key={a.id}
                href={a.href ?? "#"}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                {a.label}: <strong>{a.count}</strong>
              </Link>
            ))}
          </div>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando dados corporativos…
          </p>
        )}

        {forbidden && <AdminEmptyState title="Sem permissão" description="Você não tem acesso a este módulo." />}
        {error && !forbidden && <AdminAlert type="error" message={error} onDismiss={() => {}} />}

        <AdminTabs tabs={displayTabs} active={activeTab} onChange={onTabChange} />

        {!loading && !error && !forbidden && activeTab === "dashboard" && (
          <div className="space-y-6">
            {kpis.length > 0 && (
              <AdminMetricGrid
                items={kpis.map((k: ErpKpi) => ({
                  label: k.delta !== undefined ? `${k.label} (${k.delta > 0 ? "+" : ""}${k.delta}%)` : k.label,
                  value:
                    typeof k.value === "number" && k.value > 9999 ? k.value.toLocaleString("pt-BR") : k.value,
                }))}
                columns={4}
              />
            )}
            {charts.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {charts.map((c) => (
                  <ErpChartView key={c.id} chart={c} />
                ))}
              </div>
            )}
            {data?.quickActions && (
              <div className="flex flex-wrap gap-2">
                {data.quickActions.map((a) => (
                  <Link key={a.href} href={a.href} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                    {a.label}
                  </Link>
                ))}
              </div>
            )}
            {kpis.length === 0 && charts.length === 0 && (
              <AdminEmptyState description="Nenhum KPI ou gráfico disponível para este módulo." />
            )}
          </div>
        )}

        {activeTab === "data" && (
          <>
            {items.length > 0 ? (
              <AdminDataTable rows={items} />
            ) : (
              <AdminEmptyState description="Nenhum registro tabular no período." />
            )}
            {data?.tables?.map((t) => (
              <section key={t.id} className="mt-4">
                <h2 className="mb-2 text-sm font-semibold">{t.label}</h2>
                <AdminDataTable rows={t.rows} />
              </section>
            ))}
          </>
        )}

        {activeTab === "history" && (
          <>
            {timeline.length > 0 ? (
              <ol className="space-y-3 border-l-2 border-ecopet-green/30 pl-4">
                {timeline.map((e: ErpTimelineEvent) => (
                  <li key={e.id} className="text-sm">
                    <time className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString("pt-BR")}</time>
                    <p className="font-medium">{e.title}</p>
                    {e.description && <p className="text-muted-foreground">{e.description}</p>}
                    {e.actor && <p className="text-xs">por {e.actor}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <AdminEmptyState description="Nenhum evento no histórico." />
            )}
          </>
        )}

        {activeTab === "ai" && <ErpAiPanel insights={aiInsights} />}

        {activeTab === "workflows" && (
          <>
            {workflows.length > 0 ? (
              <AdminDataTable
                rows={workflows.map((w) => ({
                  nome: w.name,
                  status: w.status,
                  trigger: w.trigger,
                  inicio: w.startedAt,
                }))}
              />
            ) : (
              <AdminEmptyState description="Nenhum workflow em execução." />
            )}
          </>
        )}

        {data?.disclaimer && <p className="text-xs text-muted-foreground">{data.disclaimer}</p>}
      </div>
    </>
  );
}
