"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";

type RoutineReminder = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  dueAt: string;
  petName: string;
};

type RoutineData = {
  petsCount: number;
  reminders: RoutineReminder[];
  appointments: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    petName: string | null;
    serviceName: string | null;
    category: string | null;
  }>;
};

const CATEGORIES: Array<{ key: string; label: string; match: RegExp }> = [
  { key: "food", label: "Alimentação", match: /(aliment|food|feed|comida|ração|racao)/i },
  { key: "walk", label: "Passeio", match: /(passe|walk|caminh)/i },
  { key: "bath", label: "Banho", match: /(banho|bath)/i },
  { key: "grooming", label: "Escovação", match: /(escov|groom|tosa)/i },
  { key: "medication", label: "Medicamentos", match: /(medic|remedio|remédio|pill)/i },
  { key: "training", label: "Treino", match: /(trein|train|adestr)/i },
  { key: "sleep", label: "Sono", match: /(sono|sleep|dormir)/i },
  { key: "consultation", label: "Consultas", match: /(consul|vet|appointment)/i },
  { key: "vaccine", label: "Vacinas", match: /(vacin|vaccine|imuniz)/i },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function categorize(reminder: RoutineReminder): string {
  const haystack = `${reminder.type} ${reminder.title}`;
  const found = CATEGORIES.find((c) => c.match.test(haystack));
  return found?.label ?? "Outros";
}

export function ClientRoutinePage() {
  const [data, setData] = useState<RoutineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/routine", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar rotina");
      setData(json.data.routine as RoutineData);
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
        <ClientPageHeader title="Rotina" description="Rotina inteligente do seu pet." />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30" role="alert">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={load}>Tentar novamente</Button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  if (data.petsCount === 0) {
    return (
      <div className="space-y-6">
        <ClientPageHeader title="Rotina" description="Rotina inteligente do seu pet." />
        <ClientEmptyState
          icon={ListChecks}
          title="Nenhum pet cadastrado"
          description="Cadastre um pet para organizar alimentação, passeios, banho, medicamentos e mais."
          actionLabel="Cadastrar pet"
          actionHref="/cliente/pets"
        />
      </div>
    );
  }

  const grouped = new Map<string, RoutineReminder[]>();
  for (const r of data.reminders) {
    const cat = categorize(r);
    grouped.set(cat, [...(grouped.get(cat) ?? []), r]);
  }
  const orderedLabels = [...CATEGORIES.map((c) => c.label), "Outros"].filter((l) => grouped.has(l));

  return (
    <div className="space-y-6">
      <ClientPageHeader
        title="Rotina"
        description="Alimentação, passeio, banho, escovação, medicamentos, treino, sono, consultas e vacinas."
        actions={
          <Button asChild size="sm">
            <Link href="/cliente/agenda">Agendar</Link>
          </Button>
        }
      />

      {data.reminders.length === 0 && data.appointments.length === 0 ? (
        <ClientEmptyState
          icon={CalendarClock}
          title="Sem rotina cadastrada"
          description="Crie lembretes de cuidados nas páginas de cada pet para montar a rotina."
          actionLabel="Ver meus pets"
          actionHref="/cliente/pets"
        />
      ) : (
        <>
          {data.appointments.length > 0 && (
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
              <h2 className="mb-3 font-semibold">Próximas consultas e serviços</h2>
              <ul className="space-y-2">
                {data.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{a.serviceName ?? "Serviço"}</p>
                      <p className="text-zinc-500">{[a.petName, fmt(a.scheduledAt)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">{a.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orderedLabels.map((label) => (
              <section key={label} className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
                <h3 className="mb-3 font-semibold">{label}</h3>
                <ul className="space-y-2">
                  {(grouped.get(label) ?? []).map((r) => (
                    <li key={r.id} className="text-sm">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-zinc-500">{r.petName} · {fmt(r.dueAt)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
