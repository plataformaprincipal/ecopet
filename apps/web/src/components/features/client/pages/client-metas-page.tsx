"use client";

import { useCallback, useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import { ClientEmptyState } from "../client-empty-state";
import { GOAL_LABELS, type ClientGoal, type GoalType } from "@/lib/client/goals";

type GoalsPanel = { goals: ClientGoal[]; suggestions: ClientGoal[] };

const GOAL_TYPES = Object.keys(GOAL_LABELS) as GoalType[];

export function ClientMetasPage() {
  const [data, setData] = useState<GoalsPanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/metas", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json.data.goals as GoalsPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createGoal(type: GoalType) {
    setCreating(true);
    try {
      await fetch("/api/client/metas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      await load();
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <ClientPageSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Metas" description="Objetivos de saúde, rotina e economia." />

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <h2 className="mb-3 font-semibold">Criar meta</h2>
        <div className="flex flex-wrap gap-2">
          {GOAL_TYPES.map((t) => (
            <Button key={t} size="sm" variant="outline" disabled={creating} onClick={() => void createGoal(t)}>
              {GOAL_LABELS[t]}
            </Button>
          ))}
        </div>
      </section>

      {data.goals.length === 0 && data.suggestions.length === 0 ? (
        <ClientEmptyState icon={Target} title="Nenhuma meta" description="Crie metas ou aguarde sugestões baseadas nos seus dados." />
      ) : (
        <>
          {data.goals.length > 0 ? (
            <GoalList title="Suas metas" goals={data.goals} />
          ) : null}
          {data.suggestions.length > 0 ? (
            <GoalList title="Sugestões inteligentes" goals={data.suggestions} />
          ) : null}
        </>
      )}
    </div>
  );
}

function GoalList({ title, goals }: { title: string; goals: ClientGoal[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ul className="space-y-2">
        {goals.map((g) => (
          <li key={g.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm dark:border-white/5">
            <div>
              <p className="font-medium">{g.title}</p>
              <p className="text-zinc-500">
                {g.petName ? `${g.petName} · ` : ""}
                {g.current}{g.unit ? ` ${g.unit}` : ""}
                {g.target != null ? ` → ${g.target}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-700 dark:text-violet-400">{g.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
