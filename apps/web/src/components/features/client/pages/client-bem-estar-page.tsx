"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, AlertTriangle } from "lucide-react";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import type { ClientWellnessPanel } from "@/lib/client/wellness-panel";

const LEVEL_COLORS: Record<string, string> = {
  excelente: "text-emerald-600",
  bom: "text-sky-600",
  atenção: "text-amber-600",
  crítico: "text-rose-600",
};

export function ClientBemEstarPage() {
  const [data, setData] = useState<ClientWellnessPanel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/bem-estar", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json.data.wellness as ClientWellnessPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;
  if (!data) return null;

  if (data.factors.length === 0) {
    return (
      <div className="space-y-6">
        <ClientPageHeader title="Bem-estar" description="Índice holístico de saúde e rotina." />
        <ClientEmptyState icon={Heart} title="Cadastre um pet" description="O índice de bem-estar é calculado com base nos dados reais dos seus pets." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Bem-estar" description="Saúde, vacinas, peso, rotina, alimentação, atividade e sono." />

      <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-emerald-50 to-white p-6 dark:border-white/10 dark:from-emerald-950/20 dark:to-zinc-900/60">
        <p className="text-sm text-zinc-500">Índice de bem-estar</p>
        <p className="text-5xl font-bold text-zinc-900 dark:text-white">{data.index}</p>
        <p className={`mt-1 text-sm font-medium capitalize ${LEVEL_COLORS[data.level] ?? ""}`}>{data.level}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.factors.map((f) => (
          <div key={f.key} className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <p className="font-medium">{f.label}</p>
              <span className="text-sm font-semibold text-emerald-600">{f.score}/{f.maxScore}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${f.score}%` }} />
            </div>
            <p className="mt-2 text-xs text-zinc-500">{f.detail}</p>
          </div>
        ))}
      </div>

      {data.alerts.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <h2 className="font-semibold">Alertas ativos</h2>
          </div>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {data.alerts.map((a) => (
              <li key={a.id}>{a.message}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
