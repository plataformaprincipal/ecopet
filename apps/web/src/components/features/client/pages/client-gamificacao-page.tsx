"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Medal, Trophy, Zap } from "lucide-react";
import { ClientPageHeader } from "../client-page-header";
import { ClientPageSkeleton } from "../client-skeleton";
import type { ClientGamificationPanel } from "@/lib/client/gamification-panel";

export function ClientGamificacaoPage() {
  const [data, setData] = useState<ClientGamificationPanel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client/gamificacao", { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (json.success) setData(json.data.gamification as ClientGamificationPanel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ClientPageSkeleton />;
  if (!data) return null;

  const progress = Math.min((data.profile.points / data.profile.nextLevelAt) * 100, 100);

  return (
    <div className="space-y-6">
      <ClientPageHeader title="Gamificação" description="Missões, conquistas, níveis e desafios." />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <p className="text-xs text-zinc-500">Nível</p>
          <p className="text-3xl font-bold">{data.profile.level}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{data.profile.points} / {data.profile.nextLevelAt} pts</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
          <p className="mt-2 text-sm font-medium">{data.personalRank.label}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <Medal className="h-5 w-5 text-sky-500" aria-hidden />
          <p className="mt-2 text-2xl font-bold">{data.badges.filter((b) => b.earned).length}</p>
          <p className="text-xs text-zinc-500">Badges conquistados</p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" aria-hidden />
          <h2 className="font-semibold">Missões</h2>
        </div>
        <ul className="space-y-2">
          {data.missions.map((m) => (
            <li key={m.id} className="rounded-xl border border-zinc-100 px-3 py-2 dark:border-white/5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{m.title}</p>
                <span className="text-xs text-violet-600">+{m.points} pts</span>
              </div>
              <p className="text-xs text-zinc-500">{m.description}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(m.progress / m.target) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
        <div className="mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-600" aria-hidden />
          <h2 className="font-semibold">Conquistas e badges</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.badges.map((b) => (
            <span
              key={b.id}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                b.earned ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:bg-white/5"
              }`}
            >
              {b.name}
            </span>
          ))}
        </div>
      </section>

      {data.challenges.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60">
          <h2 className="mb-3 font-semibold">Desafios ativos</h2>
          <ul className="space-y-1 text-sm">
            {data.challenges.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.title}</span>
                <span className="text-zinc-500">{c.dueAt ? new Date(c.dueAt).toLocaleDateString("pt-BR") : "—"}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
