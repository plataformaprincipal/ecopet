"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MessageSquare,
  PawPrint,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientStatsCards } from "../client-stats-cards";
import { ClientEmptyState } from "../client-empty-state";
import type { ClientDashboardSummary } from "@/lib/client/dashboard-summary";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ClientDashboardHomeProps = {
  userName: string;
};

export function ClientDashboardHome({ userName }: ClientDashboardHomeProps) {
  const [summary, setSummary] = useState<ClientDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/dashboard/summary", { credentials: "include" });
      const json = await res.json();
      if (json.success) setSummary(json.data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;

  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-8">
      <ClientPageHeader
        title={`Olá, ${firstName}`}
        description="Seu resumo no ecossistema EcoPet — pets, agenda, pedidos e mensagens."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/cliente/meu-pet">Cadastrar pet</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/cliente/explorar">Agendar serviço</Link>
            </Button>
          </div>
        }
      />

      {summary ? (
        <ClientStatsCards
          items={[
            { label: "Pets", value: summary.petsCount, icon: PawPrint },
            { label: "Agendamentos", value: summary.upcomingAppointments.length, icon: Calendar },
            { label: "Mensagens", value: summary.unreadMessages, icon: MessageSquare },
            { label: "Carrinho", value: summary.cartItemsCount, icon: ShoppingCart },
          ]}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/cliente/marketplace">Explorar marketplace</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/client/orders">Ver meus pedidos</Link>
        </Button>
      </div>

      {summary && summary.recommendations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            <Sparkles className="h-4 w-4" aria-hidden />
            Recomendações
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={rec.href}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium text-zinc-900 dark:text-white">{rec.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{rec.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Próximos lembretes</h2>
          {!summary || summary.upcomingReminders.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum lembrete pendente.</p>
          ) : (
            summary.upcomingReminders.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{r.title}</p>
                <p className="text-zinc-500">
                  {r.petName} · {formatDate(r.dueAt)}
                </p>
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Próximos agendamentos</h2>
          {!summary || summary.upcomingAppointments.length === 0 ? (
            <ClientEmptyState
              icon={Calendar}
              title="Nenhum agendamento"
              description="Explore serviços e marque o próximo cuidado do seu pet."
              actionLabel="Explorar serviços"
              actionHref="/cliente/explorar"
            />
          ) : (
            summary.upcomingAppointments.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/client/appointments/${a.id}`}
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">{a.serviceName ?? "Serviço"}</p>
                <p className="text-zinc-500">
                  {a.partnerName} · {formatDate(a.scheduledAt)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pedidos recentes</h2>
          {!summary || summary.recentOrders.length === 0 ? (
            <ClientEmptyState
              icon={ShoppingBag}
              title="Nenhum pedido"
              description="Suas compras no marketplace aparecerão aqui."
              actionLabel="Ir ao marketplace"
              actionHref="/cliente/marketplace"
            />
          ) : (
            summary.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/client/orders/${o.id}`}
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-medium">R$ {o.total.toFixed(2)}</p>
                <p className="text-zinc-500">
                  {o.status} · {formatDate(o.createdAt)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Mensagens</h2>
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
            <p className="text-2xl font-semibold">{summary?.unreadMessages ?? 0}</p>
            <p className="text-sm text-zinc-500">não lidas</p>
            <Button asChild variant="ghost" className="mt-2 h-auto p-0">
              <Link href="/dashboard/messages">Abrir mensagens</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
