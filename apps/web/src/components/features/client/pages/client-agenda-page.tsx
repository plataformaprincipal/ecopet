"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CalendarClock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";

type Appointment = {
  id: string;
  scheduledAt: string;
  status: string;
  pet?: { name: string } | null;
  service?: { name: string; price: number } | null;
  partner?: { name: string; partnerProfile?: { businessName: string | null } | null } | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SCHEDULED: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  COMPLETED: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  CANCELLED: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function ClientAgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/appointments", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar agenda");
      setAppointments((json.data.appointments ?? []) as Appointment[]);
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
        <ClientPageHeader title="Agenda" description="Seus agendamentos EcoPet." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const now = Date.now();
  const upcoming = appointments.filter((a) => new Date(a.scheduledAt).getTime() >= now);
  const past = appointments.filter((a) => new Date(a.scheduledAt).getTime() < now);

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Agenda"
        description="Consultas, banho, tosa, vacinas e demais serviços agendados."
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/agenda"><CalendarPlus className="h-4 w-4" /> Novo agendamento</Link>
          </Button>
        }
      />

      {appointments.length === 0 ? (
        <ClientEmptyState
          icon={CalendarClock}
          title="Nenhum agendamento"
          description="Agende banho, tosa, consultas ou vacinas com parceiros verificados."
          actionLabel="Agendar serviço"
          actionHref="/agenda"
        />
      ) : (
        <div className="space-y-6">
          <AgendaGroup title="Próximos" items={upcoming} emptyMsg="Nenhum agendamento futuro." />
          <AgendaGroup title="Histórico" items={past} emptyMsg="Nenhum agendamento anterior." />
        </div>
      )}
    </div>
  );
}

function AgendaGroup({ title, items, emptyMsg }: { title: string; items: Appointment[]; emptyMsg: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyMsg}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/client/appointments/${a.id}`}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-white">{a.service?.name ?? "Serviço"}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-zinc-500/10 text-zinc-600"}`}>
                  {a.status}
                </span>
              </div>
              <p className="mt-1 text-zinc-500">
                {[a.pet?.name, a.partner?.partnerProfile?.businessName ?? a.partner?.name, fmt(a.scheduledAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
