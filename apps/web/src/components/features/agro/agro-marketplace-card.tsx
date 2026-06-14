"use client";

import Image from "next/image";
import { Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAgroCurrency } from "@/lib/agro/config";
import type { AgroMarketplaceItem } from "@/lib/agro/types";

interface AgroMarketplaceCardProps {
  item: AgroMarketplaceItem;
}

export function AgroMarketplaceCard({ item }: AgroMarketplaceCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-ecopet-gray/10 bg-white shadow-sm dark:bg-white/5">
      <div className="relative h-36 overflow-hidden bg-gray-100">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
        {item.aiRecommended && (
          <Badge className="absolute left-2 top-2 gap-0.5 bg-ecopet-yellow text-ecopet-dark">
            <Sparkles className="h-3 w-3" /> IA recomenda
          </Badge>
        )}
      </div>
      <div className="p-4">
        <Badge variant="default" className="mb-1 text-[10px]">{item.category}</Badge>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-xs text-ecopet-gray">{item.supplier}</p>
        <p className="mt-2 text-lg font-bold text-ecopet-green">{formatAgroCurrency(item.price)}</p>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 fill-ecopet-yellow text-ecopet-yellow" /> {item.rating}
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-ecopet-gray">{item.description}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1">Comprar</Button>
          <Button size="sm" variant="outline">Solicitar</Button>
        </div>
      </div>
    </article>
  );
}
