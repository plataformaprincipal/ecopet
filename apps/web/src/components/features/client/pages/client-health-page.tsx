"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  HeartPulse,
  Pill,
  Scale,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import type { HealthCenter } from "@/lib/client/health-center";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Section({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon: typeof Syringe;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-emerald-600" aria-hidden />
        <h2 className="font-semibold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      {empty ? <p className="text-sm text-zinc-500">Nenhum registro.</p> : children}
    </section>
  );
}

function Row({ primary, secondary, badge }: { primary: string; secondary?: string; badge?: string }) {
  return (
    <li className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-white/5">
      <div className="min-w-0">
        <p className="truncate font-medium text-zinc-900 dark:text-white">{primary}</p>
        {secondary ? <p className="truncate text-zinc-500">{secondary}</p> : null}
      </div>
      {badge ? (
        <span className="ml-3 shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {badge}
        </span>
      ) : null}
    </li>
  );
}

export function ClientHealthPage() {
  const [data, setData] = useState<HealthCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/health", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message ?? "Erro ao carregar saúde");
      setData(json.data.health as HealthCenter);
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
        <ClientPageHeader title="Saúde" description="Central de saúde dos seus pets." />
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
        <ClientPageHeader title="Saúde" description="Central de saúde dos seus pets." />
        <ClientEmptyState
          icon={HeartPulse}
          title="Nenhum pet cadastrado"
          description="Cadastre um pet para acompanhar vacinas, medicamentos, exames e consultas."
          actionLabel="Cadastrar pet"
          actionHref="/cliente/pets"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Saúde" description="Vacinas, medicamentos, exames, consultas e histórico clínico." />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Vacinas", value: data.counts.vaccines },
          { label: "Medicamentos", value: data.counts.medications },
          { label: "Exames", value: data.counts.exams },
          { label: "Consultas", value: data.counts.consultations },
          { label: "Alergias", value: data.counts.allergies },
          { label: "Pesagens", value: data.counts.weightRecords },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-center dark:border-white/10 dark:bg-zinc-900/60">
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Vacinas" icon={Syringe} empty={data.vaccines.length === 0}>
          <ul>
            {data.vaccines.map((v) => (
              <Row key={v.id} primary={v.name} secondary={`${v.petName} · ${fmt(v.date)}`} badge={v.nextDue ? `Próx. ${fmt(v.nextDue)}` : undefined} />
            ))}
          </ul>
        </Section>

        <Section title="Medicamentos" icon={Pill} empty={data.medications.length === 0}>
          <ul>
            {data.medications.map((m) => (
              <Row key={m.id} primary={m.name} secondary={[m.petName, m.frequency].filter(Boolean).join(" · ")} />
            ))}
          </ul>
        </Section>

        <Section title="Peso" icon={Scale} empty={data.weights.length === 0}>
          <ul>
            {data.weights.map((w) => (
              <Row key={w.id} primary={`${w.weight} kg`} secondary={`${w.petName} · ${fmt(w.recordedAt)}`} />
            ))}
          </ul>
        </Section>

        <Section title="Exames" icon={ClipboardList} empty={data.exams.length === 0}>
          <ul>
            {data.exams.map((e) => (
              <Row key={e.id} primary={e.type} secondary={`${e.petName} · ${fmt(e.date)}`} badge={e.result ?? undefined} />
            ))}
          </ul>
        </Section>

        <Section title="Consultas" icon={Stethoscope} empty={data.consultations.length === 0}>
          <ul>
            {data.consultations.map((c) => (
              <Row key={c.id} primary={c.type ?? "Consulta"} secondary={`${c.petName} · ${fmt(c.date)}`} />
            ))}
          </ul>
        </Section>

        <Section title="Alergias" icon={AlertTriangle} empty={data.allergies.length === 0}>
          <ul>
            {data.allergies.map((a) => (
              <Row key={a.id} primary={a.allergen} secondary={a.petName} badge={a.severity ?? undefined} />
            ))}
          </ul>
        </Section>

        <Section title="Histórico clínico" icon={Activity} empty={data.records.length === 0}>
          <ul>
            {data.records.map((r) => (
              <Row key={r.id} primary={r.title} secondary={`${r.petName} · ${fmt(r.recordDate)}`} badge={r.type} />
            ))}
          </ul>
        </Section>

        <Section title="Cirurgias e doenças" icon={HeartPulse} empty={false}>
          <p className="text-sm text-zinc-500">
            Registro dedicado de cirurgias e doenças estará disponível em breve.
          </p>
        </Section>
      </div>
    </div>
  );
}
