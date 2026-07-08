"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Activity } from "lucide-react";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import { ClientChart } from "../charts/client-chart";
import type { ClientAnalyticsPanel } from "@/lib/client/analytics-panel";

export function ClientAnalyticsPage() {
  const [data, setData] = useState<ClientAnalyticsPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/analytics", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro");
      setData(json.data.analytics as ClientAnalyticsPanel);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;
  if (error) return <p className="text-sm text-rose-600" role="alert">{error}</p>;
  if (!data) return null;

  const empty =
    data.weightEvolution.length === 0 &&
    data.monthlySpending.every((m) => m.value === 0) &&
    data.petActivities.length === 0;

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Analytics" description="Indicadores e evolução dos seus pets." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Vacinas pendentes" value={data.vaccinesPending} />
        <Stat label="Rotina cumprida" value={`${data.routineCompletion.rate}%`} />
        <Stat label="Atividades recentes" value={data.petActivities.length} />
      </div>

      {empty ? (
        <ClientEmptyState icon={BarChart3} title="Sem dados analíticos" description="Cadastre pets, registre peso e faça compras para gerar indicadores." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ClientChart title="Evolução de peso" points={data.weightEvolution} type="line" />
          <ClientChart title="Gastos mensais" points={data.monthlySpending} type="line" valuePrefix="R$ " />
          <ClientChart title="Consultas por período" points={data.consultationsByPeriod} />
          <ClientChart title="Compras por categoria" points={data.purchasesByCategory} valuePrefix="R$ " />
          <ClientChart title="Serviços mais usados" points={data.topServices} />
        </div>
      )}

      {data.petActivities.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-600" aria-hidden />
            <h2 className="font-semibold">Atividades do pet</h2>
          </div>
          <ul className="space-y-2">
            {data.petActivities.map((a) => (
              <li key={a.id} className="flex justify-between text-sm">
                <span>{a.title} · {a.petName}</span>
                <span className="text-zinc-500">{new Date(a.createdAt).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-zinc-900/60">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
