"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  MessageSquare,
  Package,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerPageHeader } from "../partner-page-header";
import { PartnerPageSkeleton } from "../partner-skeleton";
import type { PartnerDashboardSummary, PartnerAiInsight } from "@/lib/partner/ai-insights";

const priorityTone: Record<PartnerAiInsight["priority"], string> = {
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

export function PartnerAIActivitiesPage() {
  const [summary, setSummary] = useState<PartnerDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partner/dashboard/summary", { credentials: "include" });
      const json = await res.json();
      if (json.success && !json.data.locked) {
        setSummary(json.data.summary);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PartnerPageSkeleton />;

  if (!summary) {
    return (
      <div className="space-y-6">
        <PartnerPageHeader
          title="Minhas Atividades com IA"
          description="Painel inteligente com resumo das suas movimentações e recomendações."
        />
        <p className="text-sm text-zinc-500">Não foi possível carregar o painel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PartnerPageHeader
        title="Minhas Atividades com IA"
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
          { label: "Pedidos recentes", value: summary.stats.ordersCount, icon: ClipboardList },
          { label: "Agend. pendentes", value: summary.stats.appointmentsPending, icon: CalendarClock },
          { label: "Mensagens", value: summary.pendingMessages, icon: MessageSquare },
          { label: "Produtos ativos", value: summary.stats.productsActive, icon: Package },
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
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{insight.description}</p>
                    {insight.actionHref && insight.actionLabel ? (
                      <Button asChild variant="ghost" className="mt-2 h-auto p-0 text-sm">
                        <Link href={insight.actionHref}>{insight.actionLabel}</Link>
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
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pedidos recentes</h2>
          {summary.recentOrders.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum pedido recente.</p>
          ) : (
            summary.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/partner/orders/${order.id}`}
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{order.userName ?? "Cliente"}</p>
                <p className="text-zinc-500">
                  R$ {order.total.toFixed(2)} · {order.status} · {formatDate(order.createdAt)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Agendamentos recentes</h2>
          {summary.recentAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum agendamento recente.</p>
          ) : (
            summary.recentAppointments.map((apt) => (
              <Link
                key={apt.id}
                href={`/dashboard/partner/appointments/${apt.id}`}
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{apt.serviceName ?? "Serviço"}</p>
                <p className="text-zinc-500">
                  {apt.clientName ?? "Cliente"} · {apt.status} · {formatDate(apt.scheduledAt)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Alertas de estoque</h2>
          {summary.lowStockProducts.length === 0 ? (
            <p className="text-sm text-zinc-500">Estoque dentro do normal.</p>
          ) : (
            summary.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-red-200/60 bg-red-50/40 p-3 text-sm dark:border-red-500/20 dark:bg-red-500/5"
              >
                <p className="font-medium text-zinc-900 dark:text-white">{product.name}</p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Estoque: {product.stock} (mín: {product.minStock})
                </p>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Star className="h-4 w-4 text-amber-400" />
            Avaliações recebidas
          </h2>
          {summary.recentReviews.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma avaliação recente.</p>
          ) : (
            summary.recentReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{review.rating}/5 · {review.serviceName}</p>
                <p className="text-zinc-500">{review.comment ?? "Sem comentário"}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
