"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, MapPin } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photos: string[];
  description: string;
  displayStatus: string;
  ong: { id: string; name: string; city: string | null; state: string | null };
};

export function PublicAdoptionGallery() {
  const { t } = useTranslation();
  const [animals, setAnimals] = useState<Animal[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/public/adoption")
      .then((r) => r.json())
      .then((json) => {
        if (active && json?.success) setAnimals(json.data.animals);
      })
      .catch(() => {
        if (active) setAnimals([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">
          {t("ngoArea.public.adoptionTitle")}
        </h1>
        <p className="mt-1 text-zinc-500">{t("ngoArea.public.adoptionSubtitle")}</p>
      </header>

      {animals === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : animals.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <PawPrint className="mx-auto h-12 w-12 text-zinc-300" aria-hidden />
          <p className="mt-4 text-zinc-500">{t("ngoArea.public.emptyAnimals")}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <Link
              key={a.id}
              href={`/adoption/${a.id}`}
              className="group overflow-hidden rounded-3xl border border-zinc-200/80 bg-white transition hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-white/5">
                {a.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.photos[0]}
                    alt={a.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <PawPrint className="h-12 w-12 text-zinc-300" aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">{a.name}</h3>
                <p className="text-sm text-zinc-500">
                  {a.breed || "SRD"} · {a.species}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-400">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {a.ong.name}
                  {a.ong.city ? ` · ${a.ong.city}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
