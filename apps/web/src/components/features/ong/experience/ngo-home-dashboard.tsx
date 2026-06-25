"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PawPrint,
  Heart,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  PenSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatDate } from "@/lib/i18n/format";
import type { OngDashboardSummary } from "@/lib/ong/ai-insights";

type Props = { ngoName: string };

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PawPrint;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
        <Icon className="h-5 w-5 text-rose-500" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold text-zinc-900 dark:text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export function NgoHomeDashboard({ ngoName }: Props) {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<OngDashboardSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/ong/dashboard/summary", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setSummary(json.data?.summary ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const firstName = ngoName.split(" ")[0];

  return (
    <div className="space-y-7">
      <header className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-rose-500/[0.06] via-white to-white p-6 dark:border-white/10 dark:from-rose-500/10 dark:via-zinc-900/60 dark:to-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
          {t("ngoArea.home.title")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
          {t("ngoArea.home.greeting", { name: firstName })}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">{t("ngoArea.home.subtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/ngo/eccopet"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("ngoArea.home.openAi")}
          </Link>
          <Link
            href="/ngo/animals"
            className="inline-flex items-center rounded-xl border border-zinc-300 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            {t("ngoArea.home.manageAnimals")}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={PawPrint} label={t("ngoArea.home.stats.availableAnimals")} value={summary?.availableAnimals ?? 0} />
        <StatCard icon={Heart} label={t("ngoArea.home.stats.adoptionsPending")} value={summary?.adoptionRequestsPending ?? 0} />
        <StatCard icon={CheckCircle2} label={t("ngoArea.home.stats.adoptionsCompleted")} value={summary?.adoptionRequestsCompleted ?? 0} />
        <StatCard icon={Megaphone} label={t("ngoArea.home.stats.campaignsActive")} value={summary?.campaignsActive ?? 0} />
        <StatCard icon={MessageSquare} label={t("ngoArea.home.stats.unreadMessages")} value={summary?.pendingMessages ?? 0} />
        <StatCard icon={PenSquare} label={t("ngoArea.home.stats.posts")} value={summary?.recentPostsCount ?? 0} />
        <StatCard icon={PawPrint} label={t("ngoArea.home.stats.animals")} value={summary?.animalsCount ?? 0} />
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t("ngoArea.home.nextActions")}
        </h2>
        {!summary || summary.insights.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("ngoArea.home.noActions")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.insights.map((insight) => (
              <Link
                key={insight.id}
                href={insight.href ?? "/ngo"}
                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white">{insight.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{insight.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Heart className="h-4 w-4" aria-hidden />
            {t("ngoArea.home.recentRequests")}
          </h2>
          {!summary || summary.recentRequests.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("ngoArea.home.noRequests")}</p>
          ) : (
            summary.recentRequests.map((r) => (
              <Link
                key={r.id}
                href="/ngo/adoptions"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.animalName ?? "—"}</span>
                  <span className="text-xs text-zinc-500">{t(`ngoArea.requestStatus.${r.status}` as string)}</span>
                </div>
                <p className="text-zinc-500">
                  {r.requesterName ?? "—"} · {formatDate(r.createdAt, locale)}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <PawPrint className="h-4 w-4" aria-hidden />
            {t("ngoArea.home.recentAnimals")}
          </h2>
          {!summary || summary.recentAnimals.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("ngoArea.home.noAnimals")}</p>
          ) : (
            summary.recentAnimals.map((a) => (
              <Link
                key={a.id}
                href="/ngo/animals"
                className="block rounded-xl border border-zinc-200/80 bg-white p-3 text-sm dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-zinc-500">{t(`ngoArea.animalStatus.${a.status}` as string)}</span>
                </div>
                <p className="text-zinc-500">{formatDate(a.createdAt, locale)}</p>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
