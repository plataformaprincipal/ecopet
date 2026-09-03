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
import { AI_COMMERCE_SKUS } from "@/lib/ai-commerce/flags";
import { AI_COMMERCE_PRODUCTS } from "@/lib/ai-commerce/catalog";
import { getSpecialistExperience } from "@/lib/ai-commerce/specialist-experience";

type CatalogProduct = {
  sku: string;
  slug: string;
  name: string;
  tag: string;
  category: string;
  shortDescription: string;
  ctaLabel?: string;
  href: string;
  free?: boolean;
  requiresPayment?: boolean;
  avgFillMinutes?: number | null;
  priceInCents?: number;
  currency?: string;
  unitLabel?: string;
};

const STORE_GROUPS: Array<{ id: string; label: string; skus: string[] }> = [
  { id: "used", label: "Mais usados", skus: [AI_COMMERCE_SKUS.ECCOVET, AI_COMMERCE_SKUS.TRIAGE, AI_COMMERCE_SKUS.EXAMS, AI_COMMERCE_SKUS.HEALTH_PROFILE] },
  { id: "saude", label: "Saúde", skus: [AI_COMMERCE_SKUS.ECCOVET, AI_COMMERCE_SKUS.TRIAGE, AI_COMMERCE_SKUS.CHECKUP, AI_COMMERCE_SKUS.VISION] },
  { id: "nutri", label: "Nutrição e bem-estar", skus: [AI_COMMERCE_SKUS.NUTRI, AI_COMMERCE_SKUS.PESO, AI_COMMERCE_SKUS.BEHAVIOR] },
  { id: "prev", label: "Prevenção", skus: [AI_COMMERCE_SKUS.VACCINE, AI_COMMERCE_SKUS.MED, AI_COMMERCE_SKUS.DENTAL] },
  { id: "docs", label: "Documentos e histórico", skus: [AI_COMMERCE_SKUS.REPORT, AI_COMMERCE_SKUS.EXAMS, AI_COMMERCE_SKUS.HEALTH_PROFILE] },
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

function formatPrice(p: CatalogProduct) {
  if (p.free || p.priceInCents == null) return "Grátis no beta";
  return (p.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: p.currency ?? "BRL" });
}

function fromDefs(): CatalogProduct[] {
  return AI_COMMERCE_PRODUCTS.map((p) => ({
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    tag: p.tag,
    category: p.category,
    shortDescription: p.shortDescription,
    ctaLabel: p.ctaLabel,
    href: p.href,
    free: true,
    avgFillMinutes: p.avgFillMinutes,
  }));
}

export function EccoPetAiLanding() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(fromDefs());
  const [query, setQuery] = useState("");

  useEffect(() => {
    analyticsService.track(AiEvents.CATALOG_VIEW, { screen: "eccopet_hub" });
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 10_000);
    fetch("/api/ai-commerce/catalog", { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data.products) && d.data.products.length) {
          setProducts(d.data.products);
        }
      })
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timer));
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
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
          13 especialistas de IA. Um único histórico de saúde para seu pet.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ep-fg-muted)]">
          Converse com o especialista certo. Cada produto tem protocolo, resultado e relatório próprios.
        </p>
      </header>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const match = visible[0];
          if (match) window.location.href = match.href;
        }}
      >
        <input
          id="ai-search"
          className="w-full max-w-xl rounded-full border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-5 py-3 text-[var(--ep-fg)]"
          placeholder="Pergunte ou busque um especialista…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit">Abrir</Button>
      </form>

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

      {STORE_GROUPS.map((group) => {
        const items = visible.filter((p) => group.skus.includes(p.sku));
        if (!items.length) return null;
        return (
          <section key={group.id} className="mt-14" id={group.id === "used" ? "ferramentas" : group.id}>
            <h2 className="text-2xl font-semibold text-[var(--ep-fg)]">{group.label}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {items.map((p) => {
                const Icon = ICONS[p.sku] ?? Sparkles;
                const experience = getSpecialistExperience(p.sku);
                return (
                  <article
                    key={`${group.id}-${p.sku}`}
                    className="flex flex-col rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-6 shadow-[var(--shadow-sm)]"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ background: experience?.accentColor ?? "#0F8A5F" }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide" style={{ color: experience?.accentColor }}>
                      {p.tag}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--ep-fg)]">{p.name}</h3>
                    <p className="mt-2 text-sm font-medium">{p.shortDescription}</p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--ep-fg-muted)]">
                      {experience?.whatItDoes ?? p.tag}
                    </p>
                    <p className="mt-4 text-sm">
                      ~{p.avgFillMinutes ?? experience?.estimatedMinutes ?? 5} min · {formatPrice(p)}
                    </p>
                    <Button asChild className="mt-5">
                      <Link
                        href={p.href}
                        onClick={() => analyticsService.track(AiEvents.MODULE_OPEN, { screen: "eccopet_hub", label: p.sku })}
                      >
                        {p.ctaLabel ?? "Usar agora"}
                      </Link>
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
