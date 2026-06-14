"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Scale } from "lucide-react";
import { EmptyState } from "./empty-state";
import { MarketplaceGridSkeleton } from "./marketplace-skeleton";
import { MarketplaceSearchResults } from "@/components/ecosystem/marketplace/marketplace-search-results";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { searchMarketplace } from "@/lib/marketplace/api";
import { groupSearchByPartner } from "@/lib/ecosystem/search-utils";
import { formatMpPrice } from "@/lib/marketplace/config";
import type { MarketplaceProduct, MarketplaceService, MarketplacePartner } from "@/lib/marketplace/types";
import { Badge } from "@/components/ui/badge";

export function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const compareMode = searchParams.get("compare") === "1";
  const { compareItems, compareSnapshots, filters, setFilters, addSearchHistory } = useMarketplaceStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);

  useEffect(() => {
    if (q) {
      setFilters({ query: q });
      addSearchHistory(q);
    }
    searchMarketplace(q || filters.query, filters).then((r) => {
      setProducts(r.products);
      setServices(r.services);
      setPartners(r.partners);
    }).finally(() => setLoading(false));
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = groupSearchByPartner(partners, products, services);
  const total = products.length + services.length + partners.length;

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
        ai: "—",
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
              {["type", "price", "rating", "location", "ai"].map((field) => (
                <tr key={field} className="border-b">
                  <td className="p-3 font-medium capitalize">{field === "ai" ? "IA ECOPET" : field === "price" ? "Preço" : field === "rating" ? "Avaliação" : field === "location" ? "Localização" : "Tipo"}</td>
                  {rows.map((r, i) => (
                    <td key={i} className="p-3">
                      {field === "price" ? formatMpPrice(r!.price) : field === "rating" ? r!.rating : String((r as Record<string, string | number>)[field] ?? "—")}
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

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-5 w-5 text-ecopet-green" />
        <h2 className="font-display text-lg font-bold">
          {q ? `Resultados para "${q}"` : "Busca no Marketplace"}
        </h2>
        {!loading && <Badge>{total} resultados · {groups.length} parceiros</Badge>}
      </div>

      {loading ? (
        <MarketplaceGridSkeleton />
      ) : total === 0 ? (
        <EmptyState icon={Search} title="Nenhum resultado" description="Tente outros termos ou ajuste os filtros." />
      ) : (
        <MarketplaceSearchResults
          groups={groups}
          products={products}
          services={services}
          partners={partners}
        />
      )}
    </div>
  );
}
