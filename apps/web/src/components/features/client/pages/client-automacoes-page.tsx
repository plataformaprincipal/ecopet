"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import type { ClientAutomationsPanel } from "@/lib/client/automations";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ClientAutomacoesPage() {
  const [data, setData] = useState<ClientAutomationsPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/automations", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar automações");
      setData(json.data.automations as ClientAutomationsPanel);
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
  if (error) {
    return (
      <div className="space-y-4">
        <ClientPageHeader title="Automações" description="Lembretes e regras inteligentes." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Automações"
        description="Vacinas, medicamentos, consultas, recompra, alertas de saúde e gastos."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/cliente/casa-inteligente">Casa inteligente</Link>
          </Button>
        }
      />

      {data.automations.length === 0 ? (
        <ClientEmptyState
          icon={Zap}
          title="Nenhuma automação ativa"
          description="Crie lembretes de rotina e saúde nos seus pets para gerar automações inteligentes."
          actionLabel="Ver rotina"
          actionHref="/cliente/rotina"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/5">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Gatilho</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Quando</th>
              </tr>
            </thead>
            <tbody>
              {data.automations.map((a) => (
                <tr key={a.id} className="border-b border-zinc-50 last:border-0 dark:border-white/5">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">
                      {a.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{a.trigger}</td>
                  <td className="px-4 py-3 text-zinc-500">{a.action}</td>
                  <td className="px-4 py-3 text-zinc-500">{fmt(a.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
