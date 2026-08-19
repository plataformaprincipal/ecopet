"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

type NgoRow = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  description?: string | null;
};

export default function PublicNgosPage() {
  const { t } = useTranslation();
  const [ngos, setNgos] = useState<NgoRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/ngos?pageSize=24")
      .then((r) => r.json())
      .then((json: { data?: { ngos?: NgoRow[] } }) => {
        if (!cancelled) setNgos(json.data?.ngos ?? []);
      })
      .catch(() => {
        if (!cancelled) setNgos([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--ep-fg)]">
          {t("ngoArea.public.exploreNgos")}
        </h1>
        <p className="mt-2 text-[var(--ep-fg-muted)]">{t("ngoArea.public.adoptionSubtitle")}</p>
      </header>

      {ngos === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--ep-bg-muted)]" />
          ))}
        </div>
      ) : ngos.length === 0 ? (
        <p className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-8 text-center text-[var(--ep-fg-muted)]">
          {t("ngoArea.public.emptyNgos")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ngos.map((ngo) => (
            <li key={ngo.id}>
              <Link
                href={`/ngos/${ngo.id}`}
                className="flex h-full flex-col rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5 transition hover:border-ecopet-green/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ecopet-green/10 text-ecopet-green">
                    <Building2 className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-[var(--ep-fg)]">{ngo.name}</h2>
                    {(ngo.city || ngo.state) && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ep-fg-muted)]">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {[ngo.city, ngo.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {ngo.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--ep-fg-muted)]">{ngo.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-sm">
        <Link href="/adocao" className="font-medium text-ecopet-green hover:underline">
          {t("nav.adoption")}
        </Link>
      </p>
    </main>
  );
}
