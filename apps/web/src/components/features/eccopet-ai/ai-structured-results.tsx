"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import type { AIStructuredBlock } from "./types";

function formatPrice(value: unknown): string {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (typeof value === "string" && value.trim()) return value;
  return "—";
}

const cardClass =
  "flex flex-col gap-1 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-3 transition hover:border-ecopet-green/40 hover:shadow-[var(--shadow-sm)]";

function ProductCard({ item }: { item: Record<string, unknown> }) {
  const { t } = useTranslation();
  const id = typeof item.id === "string" ? item.id : null;
  const name = typeof item.name === "string" ? item.name : "Produto";
  const href = id ? `/marketplace/produto/${id}` : "/marketplace";
  const isSponsored = item.isSponsored === true || item.sponsored === true;

  return (
    <Link href={href} className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--ep-fg)]">{name}</span>
        {isSponsored ? (
          <span className="shrink-0 rounded-full bg-[var(--ep-bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--ep-fg-subtle)]">
            {t("ecopetAi.structured.sponsored")}
          </span>
        ) : null}
      </div>
      {typeof item.brand === "string" && item.brand ? (
        <span className="text-[11px] text-[var(--ep-fg-muted)]">{item.brand}</span>
      ) : null}
      {typeof item.seller === "string" && item.seller ? (
        <span className="text-[11px] text-[var(--ep-fg-subtle)]">{item.seller}</span>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-ecopet-green">{formatPrice(item.price)}</span>
        {typeof item.rating === "number" ? (
          <span className="text-[var(--ep-fg-muted)]">★ {item.rating.toFixed(1)}</span>
        ) : null}
        {typeof item.distanceKm === "number" ? (
          <span className="text-[var(--ep-fg-subtle)]">{item.distanceKm.toFixed(1)} km</span>
        ) : null}
      </div>
    </Link>
  );
}

function ServiceCard({ item }: { item: Record<string, unknown> }) {
  const id = typeof item.id === "string" ? item.id : null;
  const name = typeof item.name === "string" ? item.name : "Serviço";
  const href = id ? `/marketplace/servico/${id}` : "/marketplace/servicos";

  return (
    <Link href={href} className={cardClass}>
      <span className="text-sm font-semibold text-[var(--ep-fg)]">{name}</span>
      {typeof item.partnerName === "string" && item.partnerName ? (
        <span className="text-[11px] text-[var(--ep-fg-muted)]">{item.partnerName}</span>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-ecopet-green">{formatPrice(item.price)}</span>
        {typeof item.city === "string" && item.city ? (
          <span className="text-[var(--ep-fg-muted)]">{item.city}</span>
        ) : null}
      </div>
    </Link>
  );
}

function AdoptionCard({ item }: { item: Record<string, unknown> }) {
  const name = typeof item.name === "string" ? item.name : "Pet para adoção";
  const species = typeof item.species === "string" ? item.species : null;
  const city = typeof item.city === "string" ? item.city : null;

  return (
    <Link href="/adocao" className={cardClass}>
      <span className="text-sm font-semibold text-[var(--ep-fg)]">{name}</span>
      <div className="flex flex-wrap gap-2 text-[11px] text-[var(--ep-fg-muted)]">
        {species ? <span>{species}</span> : null}
        {city ? <span>{city}</span> : null}
      </div>
    </Link>
  );
}

export function AIStructuredResults({ blocks }: { blocks: AIStructuredBlock[] }) {
  const { t } = useTranslation();
  if (!blocks.length) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const items = block.items.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item)
        );
        if (!items.length) return null;

        const titleKey = `ecopetAi.structured.${block.kind}`;
        const title = t(titleKey);
        const label = title.startsWith("ecopetAi.") ? block.kind : title;

        return (
          <div key={`${block.kind}-${idx}`} className="w-full space-y-2">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--ep-fg-muted)]">
              {label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.slice(0, 6).map((item, i) => {
                if (block.kind === "services") {
                  return <ServiceCard key={String(item.id ?? i)} item={item} />;
                }
                if (block.kind === "adoptions") {
                  return <AdoptionCard key={String(item.id ?? i)} item={item} />;
                }
                return <ProductCard key={String(item.id ?? i)} item={item} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
