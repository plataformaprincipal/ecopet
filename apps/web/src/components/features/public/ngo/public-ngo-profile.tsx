"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Megaphone, MapPin, PawPrint } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

type NgoData = {
  ngo: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    description: string | null;
    focusArea: string | null;
    responsible: string | null;
  };
  animals: Array<{ id: string; name: string; species: string; breed: string | null; photos: string[] }>;
  campaigns: Array<{ id: string; title: string; category: string }>;
};

export function PublicNgoProfile({ ngoId }: { ngoId: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<NgoData | null | "notfound">(null);

  useEffect(() => {
    fetch(`/api/public/ngos/${ngoId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setData(json.data);
        else setData("notfound");
      })
      .catch(() => setData("notfound"));
  }, [ngoId]);

  if (data === null) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" aria-busy="true" />
      </main>
    );
  }
  if (data === "notfound") {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-zinc-300" aria-hidden />
        <p className="mt-4 text-zinc-500">404</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-rose-500/[0.08] to-white p-6 dark:border-white/10 dark:to-zinc-900/60">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 text-white">
            <Heart className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">{data.ngo.name}</h1>
            {data.ngo.city ? (
              <p className="inline-flex items-center gap-1 text-sm text-zinc-500">
                <MapPin className="h-4 w-4" aria-hidden />
                {data.ngo.city}
                {data.ngo.state ? ` · ${data.ngo.state}` : ""}
              </p>
            ) : null}
          </div>
        </div>
        {data.ngo.description ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{data.ngo.description}</p>
        ) : null}
      </header>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
          <PawPrint className="h-5 w-5 text-rose-500" aria-hidden />
          {t("ngoArea.public.animalsForAdoption")}
        </h2>
        {data.animals.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">{t("ngoArea.public.emptyAnimals")}</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.animals.map((a) => (
              <Link
                key={a.id}
                href={`/adoption/${a.id}`}
                className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/60"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-white/5">
                  {a.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.photos[0]} alt={a.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <PawPrint className="h-8 w-8 text-zinc-300" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{a.name}</p>
                  <p className="truncate text-xs text-zinc-500">{a.breed || "SRD"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">
          <Megaphone className="h-5 w-5 text-rose-500" aria-hidden />
          {t("ngoArea.public.activeCampaigns")}
        </h2>
        {data.campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">{t("ngoArea.public.emptyCampaigns")}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {t(`ngoArea.campaigns.cat.${c.category}` as string)}
                </span>
                <p className="mt-2 font-medium text-zinc-900 dark:text-white">{c.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
