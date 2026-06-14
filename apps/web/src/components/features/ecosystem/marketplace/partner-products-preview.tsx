"use client";

import { ProductCard } from "@/components/features/marketplace/product-card";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PartnerProductsPreviewProps {
  products: MarketplaceProduct[];
  partnerId: string;
  partnerName: string;
  max?: number;
}

export function PartnerProductsPreview({ products, partnerId, partnerName, max = 4 }: PartnerProductsPreviewProps) {
  if (products.length === 0) return null;

  const visible = products.slice(0, max);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ecopet-gray">Produtos de {partnerName}</h4>
        {products.length > max && (
          <Link href={`/marketplace/parceiro/${partnerId}?tab=products`} className="flex items-center gap-1 text-xs font-medium text-ecopet-green hover:underline">
            Ver todos ({products.length}) <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((p) => <ProductCard key={p.id} product={p} compact />)}
      </div>
    </div>
  );
}
