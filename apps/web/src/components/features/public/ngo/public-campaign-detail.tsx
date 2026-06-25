"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, MapPin } from "lucide-react";
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
  neededItems: string[];
  photos: string[];
  ong: { id: string; name: string; city: string | null; state: string | null; description: string | null };
};

export function PublicCampaignDetail({ campaignId }: { campaignId: string }) {
  const { t, locale } = useTranslation();
  const [campaign, setCampaign] = useState<Campaign | null | "notfound">(null);

  useEffect(() => {
    fetch(`/api/public/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setCampaign(json.data.campaign);
        else setCampaign("notfound");
      })
      .catch(() => setCampaign("notfound"));
  }, [campaignId]);

  if (campaign === null) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" aria-busy="true" />
      </main>
    );
  }
  if (campaign === "notfound") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <Megaphone className="mx-auto h-12 w-12 text-zinc-300" aria-hidden />
        <p className="mt-4 text-zinc-500">{t("ngoArea.public.emptyCampaigns")}</p>
        <Link href="/campaigns" className="mt-4 inline-block text-rose-500 underline">
          {t("ngoArea.public.campaignsTitle")}
        </Link>
      </main>
    );
  }

  const pct = campaign.goalAmount
    ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
    : 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      {campaign.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={campaign.photos[0]} alt={campaign.title} className="aspect-[21/9] w-full rounded-3xl object-cover" />
      ) : (
        <div className="flex aspect-[21/9] items-center justify-center rounded-3xl bg-rose-500/[0.06]">
          <Megaphone className="h-14 w-14 text-rose-400" aria-hidden />
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600">
          {t(`ngoArea.campaigns.cat.${campaign.category}` as string)}
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {t(`ngoArea.campaigns.urg.${campaign.urgency}` as string)}
        </span>
      </div>

      <h1 className="mt-2 font-display text-3xl font-bold text-zinc-900 dark:text-white">{campaign.title}</h1>
      <Link
        href={`/ngos/${campaign.ong.id}`}
        className="mt-1 inline-flex items-center gap-1 text-sm text-rose-500 hover:underline"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        {campaign.ong.name}
        {campaign.ong.city ? ` · ${campaign.ong.city}` : ""}
      </Link>

      {campaign.goalAmount ? (
        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {formatCurrency(campaign.raisedAmount, locale)} {t("ngoArea.campaigns.of")}{" "}
            {formatCurrency(campaign.goalAmount, locale)} ({pct}%)
          </p>
        </div>
      ) : null}

      <section className="mt-5">
        <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{campaign.description}</p>
      </section>

      {campaign.neededItems.length > 0 ? (
        <section className="mt-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("ngoArea.campaigns.neededItems")}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {campaign.neededItems.map((item, i) => (
              <li key={i} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
