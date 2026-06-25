"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hash, TrendingUp, Package, Scissors, PawPrint } from "lucide-react";
import { fetchPublicTrending, type PublicTrendingData } from "@/lib/public/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function HubTrending({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<PublicTrendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicTrending()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      className={cn(
        "rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60",
        className
      )}
      aria-label={t("social.trending.title")}
    >
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
        <TrendingUp className="h-5 w-5 text-ecopet-green" aria-hidden />
        {t("social.trending.title")}
      </h2>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.hashtags?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("social.trending.hashtags")}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.hashtags.slice(0, 8).map((h) => (
                  <Link
                    key={h.slug}
                    href={`/feed/hashtag/${h.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-ecopet-green/10 px-2.5 py-1 text-xs font-medium text-ecopet-green"
                  >
                    <Hash className="h-3 w-3" aria-hidden />
                    {h.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {data?.featuredProducts?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("social.trending.products")}</p>
              <ul className="space-y-1.5">
                {data.featuredProducts.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/marketplace/produto/${p.id}`}
                      className="flex items-center gap-2 text-sm text-zinc-600 hover:text-ecopet-green dark:text-zinc-300"
                    >
                      <Package className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data?.featuredServices?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("social.trending.services")}</p>
              <ul className="space-y-1.5">
                {data.featuredServices.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/marketplace/servico/${s.id}`}
                      className="flex items-center gap-2 text-sm text-zinc-600 hover:text-ecopet-green dark:text-zinc-300"
                    >
                      <Scissors className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                      <span className="truncate">{s.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data?.ngos?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("social.trending.ngos")}</p>
              <ul className="space-y-1.5">
                {data.ngos.slice(0, 3).map((n) => (
                  <li key={n.id} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <PawPrint className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    <span className="truncate">{n.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!data?.hashtags?.length &&
          !data?.featuredProducts?.length &&
          !data?.featuredServices?.length &&
          !data?.ngos?.length ? (
            <p className="text-sm text-zinc-500">{t("social.trending.empty")}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
