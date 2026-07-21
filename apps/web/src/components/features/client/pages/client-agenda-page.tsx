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
  PENDING: "bg-ep-warning/10 text-ep-warning",
  CONFIRMED: "bg-ep-success/10 text-ep-success",
  SCHEDULED: "bg-ep-info/10 text-ep-info",
  COMPLETED: "bg-ecopet-gray/10 text-ecopet-gray dark:text-white/70",
  CANCELLED: "bg-ep-danger/10 text-ep-danger",
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
      <div className="space-y-4 animate-fade-in">
        <ClientPageHeader title="Agenda" description="Seus agendamentos EcoPet." />
        <div className="rounded-[var(--radius-lg)] border border-ep-danger/25 bg-ep-danger/10 p-4 text-sm text-ep-danger" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3 rounded-[var(--radius-button)]" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const now = Date.now();
  const upcoming = appointments.filter((a) => new Date(a.scheduledAt).getTime() >= now);
  const past = appointments.filter((a) => new Date(a.scheduledAt).getTime() < now);

  return (
    <div className="space-y-6 animate-fade-in">
      <ClientPageHeader
        title="Agenda"
        description="Consultas, banho, tosa, vacinas e demais serviços agendados."
        actions={
          <Button asChild size="sm" className="gap-2 rounded-[var(--radius-button)]">
            <Link href="/agenda"><CalendarPlus className="h-4 w-4" strokeWidth={2} /> Novo agendamento</Link>
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
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ecopet-gray dark:text-white/50">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ecopet-gray dark:text-white/70">{emptyMsg}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/client/appointments/${a.id}`}
              className="rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-4 text-sm shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-semibold text-ecopet-dark dark:text-white">{a.service?.name ?? "Serviço"}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-ecopet-gray/10 text-ecopet-gray"}`}>
                  {a.status}
                </span>
              </div>
              <p className="mt-1 text-ecopet-gray dark:text-white/70">
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
