"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency } from "@/lib/i18n/format";

type Campaign = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  goalAmount: number | null;
  raisedAmount: number;
  photos: string[];
  ong: { id: string; name: string };
};

const URGENCY_TONE: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-amber-100 text-amber-700",
  NORMAL: "bg-zinc-100 text-zinc-600",
  LOW: "bg-zinc-100 text-zinc-500",
};

export function PublicCampaignsGallery() {
  const { t, locale } = useTranslation();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/public/campaigns")
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setCampaigns(json.data.campaigns);
      })
      .catch(() => {
        if (active) setCampaigns([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">
          {t("ngoArea.public.campaignsTitle")}
        </h1>
        <p className="mt-1 text-zinc-500">{t("ngoArea.public.campaignsSubtitle")}</p>
      </header>

      {campaigns === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <Megaphone className="mx-auto h-12 w-12 text-zinc-300" aria-hidden />
          <p className="mt-4 text-zinc-500">{t("ngoArea.public.emptyCampaigns")}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const pct = c.goalAmount ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)) : 0;
            return (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white transition hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/60"
              >
                {c.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photos[0]} alt={c.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-rose-500/[0.06]">
                    <Megaphone className="h-10 w-10 text-rose-400" aria-hidden />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600">
                      {t(`ngoArea.campaigns.cat.${c.category}` as string)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_TONE[c.urgency] ?? ""}`}>
                      {t(`ngoArea.campaigns.urg.${c.urgency}` as string)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-500">{c.description}</p>
                  <p className="mt-2 text-xs text-zinc-400">{c.ong.name}</p>
                  {c.goalAmount ? (
                    <div className="mt-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                        <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatCurrency(c.raisedAmount, locale)} {t("ngoArea.campaigns.of")}{" "}
                        {formatCurrency(c.goalAmount, locale)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
