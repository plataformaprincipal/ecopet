"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  CalendarClock,
  Cpu,
  Heart,
  PawPrint,
  PiggyBank,
  Pill,
  Scale,
  ShoppingBag,
  Sparkles,
  Syringe,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { PetOsCard, PetOsMetric, PetOsEmpty } from "./petos-card";
import type { PetOsOverview } from "@/lib/client/petos-overview";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PetOsDashboardProps = {
  userName: string;
};

export function PetOsDashboard({ userName }: PetOsDashboardProps) {
  const [data, setData] = useState<PetOsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/petos/overview", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar Pet OS");
      setData(json.data.overview as PetOsOverview);
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
        <ClientPageHeader title="Pet OS" description="O sistema operacional da vida do seu pet." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const firstName = userName.split(" ")[0];
  const weightDelta =
    data.weight && data.weight.previous != null
      ? data.weight.latest - data.weight.previous
      : null;

  return (
    <div className="space-y-8">
      <ClientPageHeader
        title={`Pet OS · Olá, ${firstName}`}
        description="Saúde, rotina, finanças, IoT e IA do seu pet em um só lugar."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/cliente/meu-pet">Meus pets</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/ia">Assistente IA</Link>
            </Button>
          </div>
        }
      />

      {/* Resumo do dia */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PetOsCard title="Resumo do dia" icon={Sparkles} accent="emerald">
          <PetOsMetric
            value={`${data.today.remindersToday + data.today.appointmentsToday}`}
            hint={`${data.today.remindersToday} lembretes · ${data.today.appointmentsToday} agendamentos hoje`}
          />
        </PetOsCard>
        <PetOsCard title="Pets ativos" icon={PawPrint} accent="violet" href="/cliente/meu-pet">
          <PetOsMetric value={data.petsCount} hint={data.pets.map((p) => p.name).join(", ") || "Nenhum pet"} />
        </PetOsCard>
        <PetOsCard title="Gastos do mês" icon={TrendingDown} accent="rose" href="/dashboard/client/orders">
          <PetOsMetric value={brl(data.finance.spentThisMonth)} hint="Pedidos no marketplace" />
        </PetOsCard>
        <PetOsCard title="Economia gerada" icon={PiggyBank} accent="emerald">
          <PetOsMetric value={brl(data.finance.savings)} hint="Cashback acumulado" />
        </PetOsCard>
      </section>

      {/* Saúde e rotina */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Saúde &amp; rotina</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PetOsCard title="Próximos compromissos" icon={CalendarClock} accent="sky" href="/agenda">
            {data.upcomingAppointments.length === 0 ? (
              <PetOsEmpty message="Nenhum agendamento próximo." />
            ) : (
              <ul className="space-y-2">
                {data.upcomingAppointments.slice(0, 3).map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium text-zinc-900 dark:text-white">{a.serviceName ?? "Serviço"}</p>
                    <p className="text-zinc-500">{[a.partnerName, formatDate(a.scheduledAt)].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>

          <PetOsCard title="Vacinas pendentes" icon={Syringe} accent="amber">
            {data.vaccinesPending.length === 0 ? (
              <PetOsEmpty message="Nenhuma vacina agendada." />
            ) : (
              <ul className="space-y-2">
                {data.vaccinesPending.slice(0, 3).map((v) => (
                  <li key={v.id} className="text-sm">
                    <p className="font-medium text-zinc-900 dark:text-white">{v.name}</p>
                    <p className="text-zinc-500">{v.petName} · {formatDay(v.nextDue)}</p>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>

          <PetOsCard title="Medicamentos" icon={Pill} accent="rose">
            {data.medications.length === 0 ? (
              <PetOsEmpty message="Nenhum medicamento ativo." />
            ) : (
              <ul className="space-y-2">
                {data.medications.slice(0, 3).map((m) => (
                  <li key={m.id} className="text-sm">
                    <p className="font-medium text-zinc-900 dark:text-white">{m.name}</p>
                    <p className="text-zinc-500">{[m.petName, m.frequency].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>

          <PetOsCard title="Peso do pet" icon={Scale} accent="violet">
            {!data.weight ? (
              <PetOsEmpty message="Nenhum registro de peso ainda." />
            ) : (
              <PetOsMetric
                value={`${data.weight.latest} kg`}
                hint={`${data.weight.petName} · ${formatDay(data.weight.recordedAt)}`}
                delta={
                  weightDelta != null
                    ? { value: `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`, positive: weightDelta <= 0 }
                    : undefined
                }
              />
            )}
          </PetOsCard>

          <PetOsCard title="Lembretes" icon={Bell} accent="sky" href="/agenda">
            {data.reminders.length === 0 ? (
              <PetOsEmpty message="Nenhum lembrete pendente." />
            ) : (
              <ul className="space-y-2">
                {data.reminders.slice(0, 3).map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="font-medium text-zinc-900 dark:text-white">{r.title}</p>
                    <p className="text-zinc-500">{r.petName} · {formatDate(r.dueAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>

          <PetOsCard title="Bem-estar geral" icon={Heart} accent="emerald">
            {data.iot.readings.length === 0 && data.petsCount === 0 ? (
              <PetOsEmpty message="Cadastre um pet e conecte dispositivos para acompanhar o bem-estar." />
            ) : (
              <PetOsMetric
                value={`${Math.min(100, data.petsCount * 20 + (data.iot.devices.length ? 20 : 0))}%`}
                hint="Índice baseado em cadastro, cuidados e dispositivos ativos"
              />
            )}
          </PetOsCard>
        </div>
      </section>

      {/* Atividade / IoT */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Atividade &amp; IoT</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PetOsCard title="Dispositivos conectados" icon={Cpu} accent="sky">
            {data.iot.devices.length === 0 ? (
              <PetOsEmpty message="Nenhum dispositivo IoT conectado." />
            ) : (
              <ul className="space-y-2">
                {data.iot.devices.slice(0, 4).map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-900 dark:text-white">{d.name}</span>
                    <span className="text-xs text-zinc-500">
                      {d.status}
                      {d.battery != null ? ` · ${d.battery}%` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>

          <PetOsCard title="Atividade &amp; sensores" icon={Activity} accent="violet">
            {data.iot.readings.length === 0 ? (
              <PetOsEmpty message="Sem leituras de sensores (atividade, sono, alimentação)." />
            ) : (
              <ul className="space-y-2">
                {data.iot.readings.slice(0, 4).map((r, i) => (
                  <li key={`${r.metricKey}-${i}`} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">{r.metricKey}</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {r.value}
                      {r.unit ? ` ${r.unit}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>

          <PetOsCard title="Alertas da IA / IoT" icon={AlertTriangle} accent="amber">
            {data.iot.alerts.length === 0 ? (
              <PetOsEmpty message="Nenhum alerta ativo." />
            ) : (
              <ul className="space-y-2">
                {data.iot.alerts.slice(0, 4).map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium text-zinc-900 dark:text-white">{a.message}</p>
                    <p className="text-zinc-500">{a.severity} · {formatDay(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>
        </div>
      </section>

      {/* Financeiro & recomendações */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Financeiro &amp; recomendações</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PetOsCard title="Carteira" icon={Wallet} accent="emerald">
            <PetOsMetric value={brl(data.finance.walletBalance)} hint="Saldo disponível" />
          </PetOsCard>

          <PetOsCard title="Conquistas" icon={Award} accent="amber">
            {!data.gamification ? (
              <PetOsEmpty message="Participe do ecossistema para ganhar conquistas." />
            ) : (
              <PetOsMetric
                value={`Nível ${data.gamification.level}`}
                hint={`${data.gamification.points} pontos · ${data.gamification.badges} badges`}
              />
            )}
          </PetOsCard>

          <PetOsCard title="Produtos recomendados" icon={ShoppingBag} accent="sky" href="/cliente/marketplace">
            {data.recommendations.products.length === 0 ? (
              <PetOsEmpty message="Sem recomendações no momento." />
            ) : (
              <ul className="space-y-2">
                {data.recommendations.products.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-zinc-900 dark:text-white">{p.name}</span>
                    <span className="ml-2 shrink-0 text-zinc-500">{brl(p.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PetOsCard>
        </div>
      </section>

      {/* Pedidos recentes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Pedidos recentes</h2>
        {data.finance.recentOrders.length === 0 ? (
          <PetOsEmpty message="Nenhum pedido ainda." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.finance.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/client/orders/${o.id}`}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <p className="font-semibold text-zinc-900 dark:text-white">{brl(o.total)}</p>
                <p className="text-zinc-500">{o.status} · {formatDay(o.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
