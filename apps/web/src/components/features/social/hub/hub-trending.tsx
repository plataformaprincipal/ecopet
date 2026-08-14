"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hash, TrendingUp, Package, Scissors, PawPrint } from "lucide-react";
import { fetchPublicTrending, type PublicTrendingData } from "@/lib/public/client-api";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TrendItem = {
  position: number;
  topic: string;
  slug: string;
  publications: number;
  publicationsLabel: string;
  category?: string;
  score?: number;
};

type TrendingPayload = PublicTrendingData & {
  trends?: TrendItem[];
  window?: string;
};

export function HubTrending({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<TrendingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchPublicTrending()
      .then((d) => setData(d as TrendingPayload))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const trends: TrendItem[] =
    data?.trends ??
    (data?.hashtags ?? []).map((h, i) => ({
      position: i + 1,
      topic: h.name.startsWith("#") ? h.name : `#${h.name}`,
      slug: h.slug,
      publications: h.usageCount,
      publicationsLabel:
        h.usageCount >= 1000
          ? `${(h.usageCount / 1000).toFixed(1).replace(".", ",")} mil`
          : String(h.usageCount),
      category: "hashtag",
    }));

  const visible = expanded ? trends : trends.slice(0, 5);

  return (
    <section
      className={cn(
        "rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/60",
        className
      )}
      aria-label={t("social.trending.title")}
    >
      <h2 className="mb-1 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
        <TrendingUp className="h-5 w-5 text-ecopet-green" aria-hidden />
        Tendências na EccoPet
      </h2>
      <p className="mb-3 text-xs text-zinc-500">Assuntos em alta com base em publicações reais</p>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.length ? (
            <ol className="space-y-1">
              {visible.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/feed/hashtag/${item.slug}`}
                    className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-zinc-50 dark:hover:bg-white/5"
                  >
                    <span className="w-5 shrink-0 pt-0.5 text-sm font-semibold text-zinc-400">{item.position}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-zinc-900 dark:text-white">{item.topic}</span>
                      <span className="block text-xs text-zinc-500">
                        {item.publicationsLabel} publicações
                      </span>
                    </span>
                    <Hash className="mt-1 h-3.5 w-3.5 shrink-0 text-ecopet-green/70" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-zinc-500">{t("social.trending.empty")}</p>
          )}

          {trends.length > 5 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-ecopet-green"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Mostrar menos" : "Mostrar mais"}
            </Button>
          ) : null}

          {data?.featuredProducts?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {t("social.trending.products")}
              </p>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {t("social.trending.services")}
              </p>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {t("social.trending.ngos")}
              </p>
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
        </div>
      )}
    </section>
  );
}
