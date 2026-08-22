"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bone,
  FileText,
  HeartPulse,
  Pill,
  ScanEye,
  Scale,
  ShieldPlus,
  Sparkles,
  Stethoscope,
  Syringe,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useTranslation } from "@/providers/i18n-provider";
import type { TranslationKey } from "@/lib/i18n/types";
import { AI_COMMERCE_SKUS } from "@/lib/ai-commerce/flags";

type CatalogProduct = {
  sku: string;
  slug: string;
  name: string;
  tag: string;
  category: string;
  shortDescription: string;
  href: string;
  free?: boolean;
  requiresPayment?: boolean;
};

const HUB_GROUPS: Array<{ labelKey: TranslationKey; skus: string[] }> = [
  { labelKey: "ecopetAi.hub.groups.saude", skus: [AI_COMMERCE_SKUS.ECCOVET, AI_COMMERCE_SKUS.TRIAGE, AI_COMMERCE_SKUS.CHECKUP, AI_COMMERCE_SKUS.HEALTH_PROFILE] },
  { labelKey: "ecopetAi.hub.groups.exames", skus: [AI_COMMERCE_SKUS.EXAMS, AI_COMMERCE_SKUS.VISION, AI_COMMERCE_SKUS.REPORT, AI_COMMERCE_SKUS.DENTAL] },
  { labelKey: "ecopetAi.hub.groups.nutricao", skus: [AI_COMMERCE_SKUS.NUTRI, AI_COMMERCE_SKUS.PESO] },
  { labelKey: "ecopetAi.hub.groups.prevencao", skus: [AI_COMMERCE_SKUS.VACCINE, AI_COMMERCE_SKUS.MED, AI_COMMERCE_SKUS.BEHAVIOR] },
];

const ICONS: Record<string, typeof Stethoscope> = {
  [AI_COMMERCE_SKUS.ECCOVET]: Stethoscope,
  [AI_COMMERCE_SKUS.TRIAGE]: Activity,
  [AI_COMMERCE_SKUS.CHECKUP]: HeartPulse,
  [AI_COMMERCE_SKUS.HEALTH_PROFILE]: ShieldPlus,
  [AI_COMMERCE_SKUS.EXAMS]: FileText,
  [AI_COMMERCE_SKUS.VISION]: ScanEye,
  [AI_COMMERCE_SKUS.REPORT]: FileText,
  [AI_COMMERCE_SKUS.DENTAL]: Bone,
  [AI_COMMERCE_SKUS.NUTRI]: Utensils,
  [AI_COMMERCE_SKUS.PESO]: Scale,
  [AI_COMMERCE_SKUS.VACCINE]: Syringe,
  [AI_COMMERCE_SKUS.MED]: Pill,
  [AI_COMMERCE_SKUS.BEHAVIOR]: Sparkles,
};

function assistantHref(role?: string) {
  if (role === "PARTNER") return "/partner/eccopet/assistente";
  if (role === "ONG") return "/ngo/eccopet/assistente";
  if (role === "CLIENT") return "/client/eccopet/assistente";
  return "/eccopet/assistente";
}

export function EccoPetAiLanding() {
  const { t } = useTranslation();
  const { data } = useAuthSession();
  const role = data?.user?.role;
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    analyticsService.track(AiEvents.CATALOG_VIEW, { screen: "eccopet_hub" });
    fetch("/api/ai-commerce/catalog")
      .then((r) => r.json())
      .then((d) => setProducts(d.success ? d.data.products : []))
      .catch(() => setProducts([]));
  }, []);

  const visible = useMemo(() => {
    const list = products ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => `${p.name} ${p.tag} ${p.shortDescription} ${p.category}`.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-medium tracking-wide text-ecopet-green">EccoPet AI</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--ep-fg)] sm:text-5xl">
          {t("ecopetAi.hub.headline")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ep-fg-muted)]">
          {t("ecopetAi.hub.subhead")}
        </p>
        <p className="mt-3 inline-flex rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg-muted)] px-3 py-1 text-xs font-medium text-[var(--ep-fg)]">
          {t("ecopetAi.hub.freeBadge")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild>
            <a href="#ferramentas">{t("ecopetAi.hub.explore")}</a>
          </Button>
          <Button asChild variant="outline">
            <Link href={assistantHref(role)}>{t("ecopetAi.hub.openAssistant")}</Link>
          </Button>
        </div>
      </header>

      <section id="ferramentas" className="mt-14">
        <label className="block text-sm font-medium text-[var(--ep-fg)]" htmlFor="ai-search">
          {t("ecopetAi.hub.searchLabel")}
        </label>
        <input
          id="ai-search"
          className="mt-2 w-full max-w-xl rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-4 py-3 text-[var(--ep-fg)]"
          placeholder={t("ecopetAi.hub.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </section>

      {!products && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-[var(--ep-border)] bg-[var(--ep-bg-elevated)]">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {HUB_GROUPS.map((group) => {
        const items = visible.filter((p) => group.skus.includes(p.sku));
        if (!items.length) return null;
        return (
          <section key={group.labelKey} className="mt-14">
            <h2 className="text-2xl font-semibold text-[var(--ep-fg)]">{t(group.labelKey)}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {items.map((p) => {
                const Icon = ICONS[p.sku] ?? Sparkles;
                return (
                  <article
                    key={p.sku}
                    className="flex flex-col rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-6 shadow-[var(--shadow-sm)]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ecopet-green/10 text-ecopet-green">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ecopet-green">{p.tag}</p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--ep-fg)]">{p.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ep-fg-muted)]">{p.shortDescription}</p>
                    <p className="mt-4 text-sm font-medium text-[var(--ep-fg)]">{t("ecopetAi.hub.free")}</p>
                    <Button asChild className="mt-5">
                      <Link href={p.href}>{t("ecopetAi.hub.useNow")}</Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
