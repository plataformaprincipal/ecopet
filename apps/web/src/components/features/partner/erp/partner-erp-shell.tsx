"use client";

import Link from "next/link";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { ErpChartView } from "@/components/features/admin/erp/erp-charts";
import { PartnerPageHeader } from "../partner-page-header";
import { Loader2, AlertTriangle, Lock } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  moduleId: string;
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

export function PartnerErpShell({ title, description, data, loading, error, locked }: Props) {
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
        <PartnerPageHeader title={title} description={description} />
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/20">
          <Lock className="h-6 w-6 text-amber-600" aria-hidden />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">Aprovação pendente</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">Este módulo ERP estará disponível após a aprovação do seu cadastro de parceiro.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <PartnerPageHeader title={title} description={description} />
        <p className="text-sm text-rose-600" role="alert">{error}</p>
      </div>
    );
  }

  const kpis = data?.kpis ?? [];
  const charts = data?.charts ?? [];
  const tables = data?.tables ?? [];
  const alerts = data?.alerts ?? [];
  const insights = data?.aiInsights ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PartnerPageHeader title={title} description={description} />

      {data?.disclaimer ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5">{data.disclaimer}</p>
      ) : null}

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a) => (
            <Link
              key={a.id}
              href={a.href ?? "#"}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {a.label}: {a.count}
            </Link>
          ))}
        </div>
      )}

      {kpis.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.key} className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
              <p className="text-xs text-zinc-500">{k.label}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-white">{formatKpiValue(k.value)}</p>
              {k.delta != null ? <p className="text-xs text-zinc-500">{k.delta > 0 ? "+" : ""}{k.delta}% vs. anterior</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-white/10">
          Sem indicadores no período.
        </div>
      )}

      {charts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {charts.map((c) => (
            <ErpChartView key={c.id} chart={c} />
          ))}
        </div>
      )}

      {tables.map((t) => (
        <section key={t.id} className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60">
          <h3 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-white/5">{t.label}</h3>
          {t.rows.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Nenhum registro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-white/5">
                  <tr>
                    {Object.keys(t.rows[0] ?? {}).map((col) => (
                      <th key={col} className="px-4 py-2">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.slice(0, 15).map((row, i) => (
                    <tr key={i} className="border-t border-zinc-50 dark:border-white/5">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{String(val ?? "—")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {(data?.timeline?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <h3 className="mb-3 text-sm font-semibold">Histórico / Auditoria</h3>
          <ul className="space-y-2">
            {(data?.timeline ?? []).slice(0, 10).map((ev) => (
              <li key={ev.id} className="flex justify-between text-sm">
                <span>{ev.title}{ev.actor ? ` · ${ev.actor}` : ""}</span>
                <span className="text-zinc-500">{new Date(ev.date).toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {insights.length > 0 && (
        <section className="rounded-2xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <h3 className="mb-2 text-sm font-semibold text-violet-900 dark:text-violet-100">Insights</h3>
          <ul className="space-y-2">
            {insights.map((ins) => (
              <li key={ins.id} className="text-sm text-violet-800 dark:text-violet-200">
                <strong>{ins.title}</strong> — {ins.description}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
