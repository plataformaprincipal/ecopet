"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeAgeFromBirthDate } from "@/lib/pets/labels";
import {
  vaccinationStatus,
  daysUntilNextDose,
  type VaccinationStatusCode,
} from "@/lib/pets/vaccination-status";
import { useSimpleLanguage } from "@/hooks/use-simple-language";

export type VaccinationRecord = {
  id: string;
  name: string;
  manufacturer?: string | null;
  batch?: string | null;
  date: string | Date;
  nextDue?: string | Date | null;
  veterinarian?: string | null;
  notes?: string | null;
};

export type VaccinationBookletPet = {
  name: string;
  photo?: string | null;
  species: string;
  breed?: string | null;
  birthDate?: string | Date | null;
  age?: string | null;
};

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(v: string | Date | null | undefined) {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

const STATUS_META: Record<VaccinationStatusCode, { label: string; className: string }> = {
  EM_DIA: {
    label: "Em dia",
    className: "bg-ecopet-green/15 text-ecopet-green",
  },
  PROXIMA: {
    label: "Próxima",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  ATRASADA: {
    label: "Atrasada",
    className: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
  SEM_DATA: {
    label: "Sem informação",
    className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
  },
};

export function VaccinationBooklet({
  pet,
  vaccinations,
}: {
  pet: VaccinationBookletPet;
  vaccinations: VaccinationRecord[];
}) {
  const { s } = useSimpleLanguage();
  const sorted = useMemo(
    () =>
      [...vaccinations].sort((a, b) => {
        const da = toDate(a.date)?.getTime() ?? 0;
        const db = toDate(b.date)?.getTime() ?? 0;
        return db - da;
      }),
    [vaccinations]
  );

  const alerts = useMemo(() => {
    return sorted
      .map((v) => {
        const status = vaccinationStatus(v.nextDue);
        const days = daysUntilNextDose(v.nextDue);
        if (status === "ATRASADA") {
          return { id: v.id, tone: "danger" as const, text: `Vacina atrasada: ${v.name}` };
        }
        if (status === "PROXIMA" && days != null) {
          return {
            id: v.id,
            tone: "warn" as const,
            text: `Próxima vacina (${v.name}) em ${days} dia${days === 1 ? "" : "s"}`,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: string; tone: "danger" | "warn"; text: string }>;
  }, [sorted]);

  const ageLabel =
    pet.age ||
    computeAgeFromBirthDate(
      pet.birthDate instanceof Date ? pet.birthDate.toISOString() : pet.birthDate ?? undefined
    ) ||
    "Idade não informada";

  return (
    <section
      className="overflow-hidden rounded-3xl border border-ecopet-green/20 bg-gradient-to-b from-ecopet-green/5 to-transparent dark:from-ecopet-green/10"
      aria-label={s("Caderneta de Vacinas")}
    >
      <header className="flex flex-wrap items-center gap-4 border-b border-ecopet-green/15 px-5 py-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-white/5">
          {pet.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Syringe className="h-6 w-6 text-ecopet-green" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ecopet-green">{s("Caderneta de Vacinas")}</p>
          <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white">{pet.name}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {pet.species}
            {pet.breed ? ` · ${pet.breed}` : ""} · {ageLabel}
          </p>
          {pet.birthDate ? (
            <p className="text-xs text-zinc-400">Nascimento: {formatDate(pet.birthDate)}</p>
          ) : null}
        </div>
      </header>

      {alerts.length > 0 ? (
        <div className="space-y-2 px-5 pt-4">
          {alerts.map((a) => (
            <p
              key={a.id}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                a.tone === "danger"
                  ? "bg-red-500/10 text-red-800 dark:text-red-200"
                  : "bg-amber-500/10 text-amber-800 dark:text-amber-200"
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {a.text}
            </p>
          ))}
          <p className="text-xs text-zinc-500">
            Estes alertas são lembretes de registro — não substituem orientação veterinária.
          </p>
        </div>
      ) : null}

      <div className="space-y-3 p-5">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{s("Vacinas tomadas")}</h3>
        {sorted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/10">
            {s("Nenhuma vacina registrada ainda.")}
          </p>
        ) : (
          <ol className="relative space-y-3 border-l border-ecopet-green/25 pl-4">
            {sorted.map((v) => {
              const status = vaccinationStatus(v.nextDue);
              const meta = STATUS_META[status];
              return (
                <li key={v.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-3 h-2.5 w-2.5 rounded-full bg-ecopet-green" aria-hidden />
                  <article className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/70">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-zinc-900 dark:text-white">{v.name}</h4>
                        <p className="text-xs text-zinc-500">Aplicada em {formatDate(v.date)}</p>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>
                        {status === "EM_DIA" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
                        {status === "PROXIMA" || status === "ATRASADA" ? <Clock className="h-3.5 w-3.5" aria-hidden /> : null}
                        {s(meta.label)}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-1 text-xs text-zinc-500 sm:grid-cols-2">
                      {v.veterinarian ? (
                        <div>
                          <dt className="inline font-medium text-zinc-600 dark:text-zinc-300">Veterinário: </dt>
                          <dd className="inline">{v.veterinarian}</dd>
                        </div>
                      ) : null}
                      {v.batch ? (
                        <div>
                          <dt className="inline font-medium text-zinc-600 dark:text-zinc-300">Lote: </dt>
                          <dd className="inline">{v.batch}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="inline font-medium text-zinc-600 dark:text-zinc-300">Próxima dose: </dt>
                        <dd className="inline">{formatDate(v.nextDue)}</dd>
                      </div>
                      {v.notes ? (
                        <div className="sm:col-span-2">
                          <dt className="inline font-medium text-zinc-600 dark:text-zinc-300">Obs.: </dt>
                          <dd className="inline">{v.notes}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
