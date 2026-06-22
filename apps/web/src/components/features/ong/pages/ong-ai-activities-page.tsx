"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Heart,
  MessageSquare,
  PawPrint,
  PenSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OngPageHeader } from "../ong-page-header";
import { OngPageSkeleton } from "../ong-skeleton";
import type { OngDashboardSummary, OngAiInsight } from "@/lib/ong/ai-insights";

const priorityTone: Record<OngAiInsight["priority"], string> = {
  high: "border-red-200/80 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5",
  medium: "border-amber-200/80 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5",
  low: "border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/60",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OngAIActivitiesPage() {
  const [summary, setSummary] = useState<OngDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ong/dashboard/summary", { credentials: "include" });
      const json = await res.json();
      if (json.success) setSummary(json.data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <OngPageSkeleton />;

  if (!summary) {
    return (
      <div className="space-y-6">
        <OngPageHeader
          title="Atividades e Apoio com IA"
          description="Painel inteligente com resumo das movimentações e recomendações."
        />
        <p className="text-sm text-zinc-500">Não foi possível carregar o painel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <OngPageHeader
        title="Atividades e Apoio com IA"
        description="Resumo das últimas movimentações e recomendações baseadas nos seus dados reais. Integração com IA avançada em preparação."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Motor local por regras
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Animais cadastrados", value: summary.animalsCount, icon: PawPrint },
          { label: "Adoções em análise", value: summary.adoptionsInProgress, icon: Heart },
          { label: "Mensagens pendentes", value: summary.pendingMessages, icon: MessageSquare },
          { label: "Posts recentes", value: summary.recentPostsCount, icon: PenSquare },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">{label}</p>
              <Icon className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Recomendações inteligentes
        </h2>
        {summary.insights.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-white/10">
            Tudo em ordem. Nenhuma recomendação pendente com base nos seus dados atuais.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {summary.insights.map((insight) => (
              <article
                key={insight.id}
                className={`rounded-2xl border p-4 shadow-sm ${priorityTone[insight.priority]}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-zinc-900 dark:text-white">{insight.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {insight.description}
                    </p>
                    {insight.href ? (
                      <Button asChild variant="ghost" className="mt-2 h-auto p-0 text-sm">
                        <Link href={insight.href}>Ver detalhes</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Animais recentes</h2>
          {summary.recentAnimals.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum animal cadastrado.</p>
          ) : (
            summary.recentAnimals.map((animal) => (
              <Link
                key={animal.id}
                href="/ong/adocoes"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{animal.name}</p>
                <p className="text-zinc-500">
                  {animal.status} · {formatDate(animal.createdAt)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Ações sugeridas</h2>
          <div className="space-y-2">
            {[
              { label: "Cadastrar animal", href: "/ong/adocoes" },
              { label: "Criar publicação", href: "/ong/comunidade" },
              { label: "Responder mensagens", href: "/dashboard/messages" },
              { label: "Completar perfil", href: "/ong/perfil-gestao" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-white/10 dark:bg-zinc-900/60 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
