"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, PiggyBank, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import { ClientChart } from "../charts/client-chart";
import type { ClientFinancePanel } from "@/lib/client/finance-panel";

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ClientFinanceiroPage() {
  const [data, setData] = useState<ClientFinancePanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [finRes, statusRes] = await Promise.all([
        fetch("/api/client/finance", { credentials: "include", cache: "no-store" }),
        fetch("/api/client/ai/status", { credentials: "include" }),
      ]);
      const finJson = await finRes.json();
      const statusJson = await statusRes.json();
      if (!finRes.ok || finJson.success === false) throw new Error(finJson.error?.message ?? "Erro ao carregar");
      setData(finJson.data.finance as ClientFinancePanel);
      if (statusJson.success) setAiConfigured(statusJson.data.configured as boolean);
      const b = (finJson.data.finance as ClientFinancePanel).budget.monthly;
      if (b != null) setBudgetInput(String(b));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveBudget() {
    const monthly = Number(budgetInput);
    if (Number.isNaN(monthly)) return;
    await fetch("/api/client/finance/budget", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthly }),
    });
    void load();
  }

  async function askFinance(prompt: string) {
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await fetch("/api/client/ai/finance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setAiReply(json.error?.message ?? "IA ainda não configurada.");
        return;
      }
      setAiReply(json.data.content ?? "Sem resposta.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <ClientPageSkeleton />;
  if (error) {
    return (
      <div className="space-y-4">
        <ClientPageHeader title="Financeiro" description="Gastos, orçamento e previsões." />
        <p className="text-sm text-rose-600" role="alert">{error}</p>
        <Button onClick={load}>Tentar novamente</Button>
      </div>
    );
  }
  if (!data) return null;

  const hasSpend = data.spentThisMonth > 0 || data.spentByCategory.length > 0;

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Financeiro pessoal" description={`Resumo de ${data.month.label}`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Wallet} label="Gastos do mês" value={money(data.spentThisMonth)} />
        <Metric icon={TrendingUp} label="Previsão próximo mês" value={money(data.forecastNextMonth)} />
        <Metric icon={PiggyBank} label="Orçamento restante" value={data.budget.remaining != null ? money(data.budget.remaining) : "—"} />
        <Metric icon={DollarSign} label="Reembolsos" value={money(data.refunds.total)} />
      </div>

      {!hasSpend ? (
        <ClientEmptyState
          icon={Wallet}
          title="Sem movimentação financeira"
          description="Suas compras, consultas e serviços aparecerão aqui quando houver registros."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ClientChart title="Gastos mensais" points={data.monthlyHistory.map((m) => ({ label: m.label, value: m.amount }))} type="line" valuePrefix="R$ " />
          <ClientChart title="Por categoria" points={data.spentByCategory.map((c) => ({ label: c.label, value: c.amount }))} valuePrefix="R$ " />
          <ClientChart title="Por pet" points={data.spentByPet.map((p) => ({ label: p.petName, value: p.amount }))} valuePrefix="R$ " />
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <h2 className="font-semibold">Orçamento mensal</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input type="number" min={0} placeholder="Ex: 500" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} className="max-w-[200px]" />
          <Button onClick={saveBudget}>Salvar orçamento</Button>
        </div>
        {data.budget.percentUsed != null ? (
          <p className="mt-2 text-sm text-zinc-500">{data.budget.percentUsed.toFixed(0)}% do orçamento utilizado</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" aria-hidden />
          <h2 className="font-semibold">IA Financeira</h2>
        </div>
        {!aiConfigured ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">IA ainda não configurada.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {["Quanto gastei este mês?", "Onde posso economizar?", "Qual pet gera mais custo?", "Quanto gastei com medicamentos?", "Qual previsão do próximo mês?"].map((q) => (
                <Button key={q} size="sm" variant="outline" disabled={aiLoading} onClick={() => void askFinance(q)}>{q}</Button>
              ))}
            </div>
            {aiReply ? <p className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-white/5">{aiReply}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}
