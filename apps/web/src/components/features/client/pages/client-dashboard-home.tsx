"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  PawPrint,
  Pill,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Syringe,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { PetOsCard, PetOsMetric, PetOsEmpty } from "../petos/petos-card";
import type { PetOsOverview } from "@/lib/client/petos-overview";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ClientDashboardHomeProps = {
  userName: string;
};

export function ClientDashboardHome({ userName }: ClientDashboardHomeProps) {
  const [data, setData] = useState<PetOsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/petos/overview", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar painel");
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

  const firstName = userName.split(" ")[0];

  if (error) {
    return (
      <div className="space-y-4">
        <ClientPageHeader title={`Olá, ${firstName}`} description="Seu painel no ecossistema EcoPet." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <ClientPageHeader
        title={`Olá, ${firstName}`}
        description="Resumo do dia, saúde, agenda, finanças e recomendações do seu pet."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/cliente/pets">Meus pets</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/cliente/agenda">Agendar serviço</Link>
            </Button>
          </div>
        }
      />

      {/* Linha 1: métricas do dia */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PetOsCard title="Resumo do dia" icon={Sparkles} accent="emerald">
          <PetOsMetric
            value={data.today.remindersToday + data.today.appointmentsToday}
            hint={`${data.today.remindersToday} lembretes · ${data.today.appointmentsToday} agendamentos hoje`}
          />
        </PetOsCard>
        <PetOsCard title="Pets cadastrados" icon={PawPrint} accent="violet" href="/cliente/pets">
          <PetOsMetric value={data.petsCount} hint={data.pets.map((p) => p.name).join(", ") || "Nenhum pet"} />
        </PetOsCard>
        <PetOsCard title="Gastos do mês" icon={TrendingDown} accent="rose" href="/dashboard/client/orders">
          <PetOsMetric value={brl(data.finance.spentThisMonth)} hint="Compras no marketplace" />
        </PetOsCard>
        <PetOsCard title="Medicamentos pendentes" icon={Pill} accent="amber" href="/cliente/saude">
          <PetOsMetric value={data.today.medicationsActive} hint="Tratamentos ativos" />
        </PetOsCard>
      </section>

      {/* Linha 2: saúde e agenda */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PetOsCard title="Próximas consultas" icon={CalendarClock} accent="sky" href="/cliente/agenda">
          {data.upcomingAppointments.length === 0 ? (
            <PetOsEmpty message="Nenhuma consulta agendada." />
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

        <PetOsCard title="Vacinas pendentes" icon={Syringe} accent="amber" href="/cliente/saude">
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

        <PetOsCard title="Alertas importantes" icon={AlertTriangle} accent="rose">
          {data.iot.alerts.length === 0 ? (
            <PetOsEmpty message="Nenhum alerta no momento." />
          ) : (
            <ul className="space-y-2">
              {data.iot.alerts.slice(0, 3).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium text-zinc-900 dark:text-white">{a.message}</p>
                  <p className="text-zinc-500">{a.severity} · {formatDay(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </PetOsCard>
      </section>

      {/* Linha 3: recomendações */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        <PetOsCard title="Serviços recomendados" icon={Stethoscope} accent="emerald" href="/cliente/agenda">
          {data.recommendations.services.length === 0 ? (
            <PetOsEmpty message="Sem serviços recomendados." />
          ) : (
            <ul className="space-y-2">
              {data.recommendations.services.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-zinc-900 dark:text-white">{s.name}</span>
                  <span className="ml-2 shrink-0 text-zinc-500">{brl(s.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </PetOsCard>

        <PetOsCard title="Atividades recentes" icon={Activity} accent="violet">
          {data.recentActivities.length === 0 ? (
            <PetOsEmpty message="Nenhuma atividade registrada." />
          ) : (
            <ul className="space-y-2">
              {data.recentActivities.slice(0, 3).map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium text-zinc-900 dark:text-white">{e.title}</p>
                  <p className="text-zinc-500">{e.petName} · {formatDay(e.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </PetOsCard>
      </section>

      {data.recommendations.products.length === 0 && data.petsCount === 0 ? (
        <p className="text-sm text-zinc-500">
          Comece cadastrando um pet em <Link href="/cliente/pets" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">Meus pets</Link> para liberar todo o painel.
        </p>
      ) : null}
    </div>
  );
}
