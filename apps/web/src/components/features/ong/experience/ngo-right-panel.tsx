"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Heart, Megaphone, Lightbulb } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatDate } from "@/lib/i18n/format";
import type { OngDashboardSummary } from "@/lib/ong/ai-insights";
import type { SerializedCampaign } from "@/lib/ong/serialize-campaign";

export function NgoRightPanel() {
  const { t, locale } = useTranslation();
  const [summary, setSummary] = useState<OngDashboardSummary | null>(null);
  const [campaigns, setCampaigns] = useState<SerializedCampaign[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/ong/dashboard/summary", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setSummary(json.data?.summary ?? null);
      })
      .catch(() => undefined);
    fetch("/api/ong/campaigns", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setCampaigns(json.data?.campaigns ?? []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const pendingRequests = (summary?.recentRequests ?? []).filter(
    (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
  );
  const urgentCampaigns = campaigns.filter(
    (c) => c.status === "ACTIVE" && (c.urgency === "HIGH" || c.urgency === "URGENT")
  );

  return (
    <aside className="hidden w-80 shrink-0 space-y-4 overflow-y-auto border-l border-zinc-200/80 bg-white/40 px-4 py-5 dark:border-white/10 dark:bg-zinc-950/40 xl:block">
      <section className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-rose-500" aria-hidden />
          {t("ngoArea.right.assistant")}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">{t("ngoArea.right.assistantCta")}</p>
        <Link
          href="/ngo/eccopet"
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
        >
          {t("ngoArea.right.openAssistant")}
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Heart className="h-4 w-4" aria-hidden />
          {t("ngoArea.right.pendingAdoptions")}
        </h3>
        {pendingRequests.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {pendingRequests.slice(0, 4).map((r) => (
              <li key={r.id} className="text-xs">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{r.animalName ?? "—"}</p>
                <p className="text-zinc-500">{r.requesterName ?? "—"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("ngoArea.right.noAdoptions")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Megaphone className="h-4 w-4" aria-hidden />
          {t("ngoArea.right.urgentCampaigns")}
        </h3>
        {urgentCampaigns.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {urgentCampaigns.slice(0, 4).map((c) => (
              <li key={c.id} className="text-xs">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{c.title}</p>
                <p className="text-zinc-500">
                  {c.deadline ? formatDate(c.deadline, locale) : t(`ngoArea.campaigns.urg.${c.urgency}` as string)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">{t("ngoArea.right.noCampaigns")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <Lightbulb className="h-4 w-4 text-rose-500" aria-hidden />
          {t("ngoArea.right.tip")}
        </h3>
        <p className="mt-2 text-xs text-zinc-500">{t("ngoArea.right.tipText")}</p>
      </section>
    </aside>
  );
}
