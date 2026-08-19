"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Scale } from "lucide-react";
import { MarketplacePageWrapper } from "@/components/features/marketplace/marketplace-page-wrapper";
import { MarketplaceCatalog } from "@/components/features/marketplace/marketplace-catalog";
import { MarketplaceGridSkeleton } from "@/components/features/marketplace/marketplace-skeleton";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { formatMpPrice } from "@/lib/marketplace/config";

function SearchInner() {
  const searchParams = useSearchParams();
  const compareMode = searchParams.get("compare") === "1";
  const { compareItems, compareSnapshots } = useMarketplaceStore();

  if (compareMode && compareItems.length >= 2) {
    const rows = compareItems.map((c) => {
      const snap = compareSnapshots[`${c.type}:${c.id}`];
      if (!snap) return null;
      return {
        name: snap.name,
        price: snap.price,
        rating: snap.rating,
        location: snap.location ?? "—",
        type: c.type === "product" ? "Produto" : "Serviço",
      };
    }).filter(Boolean);

    return (
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Scale className="h-5 w-5" /> Comparativo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Critério</th>
                {rows.map((r, i) => <th key={i} className="p-3 text-left">{r?.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {["type", "price", "rating", "location"].map((field) => (
                <tr key={field} className="border-b">
                  <td className="p-3 font-medium">{field === "price" ? "Preço" : field === "rating" ? "Avaliação" : field === "location" ? "Localização" : "Tipo"}</td>
                  {rows.map((r, i) => (
                    <td key={i} className="p-3">
                      {field === "price" ? formatMpPrice(r!.price) : String((r as Record<string, string | number>)[field] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <MarketplaceCatalog />;
}

export default function BuscaPage() {
  return (
    <MarketplacePageWrapper title="Busca">
      <Suspense fallback={<MarketplaceGridSkeleton />}>
        <SearchInner />
      </Suspense>
    </MarketplacePageWrapper>
  );
}
