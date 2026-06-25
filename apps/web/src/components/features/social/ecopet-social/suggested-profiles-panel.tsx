"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, Building2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchPublicTrending, type PublicTrendingData } from "@/lib/public/client-api";
import { useAuthGate } from "@/providers/auth-gate-provider";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function SuggestedProfilesPanel({ className }: { className?: string }) {
  const { requireAuth } = useAuthGate();
  const { t } = useTranslation();
  const [data, setData] = useState<PublicTrendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicTrending()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const partners = data?.featuredPartners?.slice(0, 4) ?? [];
  const ngos = data?.ngos?.slice(0, 3) ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      <section className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50" aria-label="Perfis sugeridos">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <Store className="h-5 w-5 text-ecopet-green" aria-hidden />
          {t("social.panels.suggestedPartners")}
        </h2>
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : partners.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("social.panels.noSuggestions")}</p>
        ) : (
          <ul className="space-y-2">
            {partners.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link href={`/marketplace/parceiro/${p.id}`} className="block truncate text-sm font-medium text-zinc-900 hover:text-ecopet-green dark:text-white">
                    {p.name}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">{[p.category, p.city].filter(Boolean).join(" · ") || t("social.panels.partner")}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => requireAuth()}>
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/50" aria-label="ONGs em destaque">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
          <Building2 className="h-5 w-5 text-ecopet-green" aria-hidden />
          {t("social.panels.featuredNgos")}
        </h2>
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {[1, 2].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : ngos.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("social.panels.noNgos")}</p>
        ) : (
          <ul className="space-y-2">
            {ngos.map((n) => (
              <li key={n.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ecopet-green/10">
                  <Building2 className="h-4 w-4 text-ecopet-green" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{n.name}</p>
                  {n.city ? <p className="truncate text-xs text-zinc-500">{n.city}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full rounded-xl">
          <Link href="/adocao">{t("social.panels.viewAdoptions")}</Link>
        </Button>
      </section>
    </div>
  );
}
