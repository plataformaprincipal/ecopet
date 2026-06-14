"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Calendar, Clock, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import type { CartItem } from "@/lib/marketplace/types";

interface CartQuoteItemProps {
  item: CartItem;
}

export function CartQuoteItem({ item }: CartQuoteItemProps) {
  const { removeFromCart } = useMarketplaceStore();
  const expiring = item.quoteValidUntil && new Date(item.quoteValidUntil).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex gap-3 rounded-xl border border-ecopet-yellow/30 bg-ecopet-yellow/5 p-3">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ecopet-green/10">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        ) : (
          <FileText className="h-8 w-8 text-ecopet-green" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-[10px] font-medium uppercase text-ecopet-yellow">Orçamento personalizado</p>
              {item.quoteStatus && <Badge variant="outline" className="text-[10px]">{item.quoteStatus}</Badge>}
            </div>
            <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
            <p className="text-xs text-ecopet-gray">{item.partnerName}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-red-500" onClick={() => removeFromCart(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {item.quoteDescription && (
          <p className="mt-1 line-clamp-2 text-xs text-ecopet-gray">{item.quoteDescription}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-ecopet-gray">
          {item.quoteValidUntil && (
            <span className={expiring ? "flex items-center gap-1 text-amber-600" : "flex items-center gap-1"}>
              {expiring && <AlertTriangle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" /> Validade: {new Date(item.quoteValidUntil).toLocaleDateString("pt-BR")}
            </span>
          )}
          {item.executionDeadline && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Execução: {new Date(item.executionDeadline).toLocaleDateString("pt-BR")}</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          {item.quoteId && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild>
              <Link href={`/marketplace/orcamentos?id=${item.quoteId}`}>Ver detalhes</Link>
            </Button>
          )}
          <span className="ml-auto font-bold text-ecopet-green">{formatMpPrice(item.price)}</span>
        </div>
      </div>
    </div>
  );
}
