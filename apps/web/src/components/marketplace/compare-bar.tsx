"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { getProductById, getServiceById } from "@/lib/marketplace/mock-data";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useTranslation } from "@/providers/i18n-provider";

export function CompareBar() {
  const { t } = useTranslation();
  const { compareItems, compareSnapshots, clearCompare } = useMarketplaceStore();

  if (compareItems.length === 0) return null;

  const items = compareItems.map((c) => {
    const key = `${c.type}:${c.id}`;
    const snap = compareSnapshots[key];
    if (snap) return { ...c, ...snap };
    if (c.type === "product") {
      const p = getProductById(c.id);
      return p ? { ...c, name: p.name, price: p.price, rating: p.rating, location: p.partner.location } : null;
    }
    const s = getServiceById(c.id);
    return s ? { ...c, name: s.name, price: s.price, rating: s.rating, location: s.partner.location } : null;
  }).filter(Boolean);

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl border border-ecopet-green/30 bg-white p-4 shadow-xl dark:bg-[#0f1419] lg:bottom-4 lg:left-auto lg:right-8 lg:w-96">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4 text-ecopet-green" />
          {t("marketplace.compareBar.title", { count: String(items.length) })}
        </div>
        <button type="button" onClick={clearCompare} className="text-xs text-ecopet-gray hover:text-red-500">
          {t("marketplace.compareBar.clear")}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item) => item && (
          <div key={`${item.type}-${item.id}`} className="flex items-center justify-between text-xs">
            <span className="line-clamp-1 font-medium">{item.name}</span>
            <span className="shrink-0 text-ecopet-green">{formatMpPrice(item.price)}</span>
          </div>
        ))}
      </div>
      {items.length >= 2 && (
        <Link href="/marketplace/busca?compare=1">
          <Button size="sm" className="mt-3 w-full">{t("marketplace.compareBar.view")}</Button>
        </Link>
      )}
    </div>
  );
}
