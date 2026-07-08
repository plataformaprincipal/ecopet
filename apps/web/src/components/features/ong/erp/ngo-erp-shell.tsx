"use client";

import Link from "next/link";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { ErpChartView } from "@/components/features/admin/erp/erp-charts";
import { OngPageHeader } from "../ong-page-header";
import { Loader2, Lock } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  data: ErpModuleResponse | null;
  loading: boolean;
  error: string;
  locked: boolean;
};

function formatKpiValue(value: number | string) {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  }
  return value;
}

export function NgoErpShell({ title, description, data, loading, error, locked }: Props) {
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        Carregando módulo…
      </div>
    );
  }

  if (locked) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <OngPageHeader title={title} description={description} />
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
          <Lock className="h-6 w-6 text-amber-600" aria-hidden />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">ONG em análise</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Este módulo estará disponível após a aprovação do cadastro da ONG.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <OngPageHeader title={title} description={description} />
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      </div>
    );
  }

  const kpis = data?.kpis ?? [];
  const charts = data?.charts ?? [];
  const tables = data?.tables ?? [];
  const alerts = data?.alerts ?? [];
  const insights = data?.aiInsights ?? [];
  const quickActions = data?.quickActions ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <OngPageHeader title={title} description={description} />

      {data?.disclaimer ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5">
          {data.disclaimer}
        </p>
      ) : null}

      {quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a) => (
            <Link
              key={a.id}
              href={a.href ?? "#"}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {kpis.map((k) => (
            <div
              key={k.key}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{formatKpiValue(k.value)}</p>
              <p className="text-xs text-zinc-500">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {charts.map((c) => (
        <ErpChartView key={c.id} chart={c} />
      ))}

      {tables.map((t) => (
        <section key={t.id} className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60">
          <h3 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-white/10">{t.label}</h3>
          {t.rows.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Nenhum registro.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-white/5">
                <tr>
                  {Object.keys(t.rows[0] as object).map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, i) => (
                  <tr key={(row as { id?: string }).id ?? i} className="border-t border-zinc-100 dark:border-white/5">
                    {Object.values(row as object).map((val, j) => (
                      <td key={j} className="max-w-[200px] truncate px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {String(val ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}

      {insights.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-500">Insights</h3>
          {insights.map((ins) => (
            <p key={ins.id} className="text-sm text-zinc-600 dark:text-zinc-400">
              {ins.title}: {ins.description}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
