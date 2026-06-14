"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { CartQuoteItem } from "@/components/features/ecosystem/quotes/cart-quote-item";
import type { CartItem as CartItemType } from "@/lib/marketplace/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useMarketplaceStore();

  if (item.type === "quote") {
    return <CartQuoteItem item={item} />;
  }

  return (
    <div className="flex gap-3 rounded-xl border border-ecopet-gray/10 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase text-ecopet-green">{item.type === "service" ? "Serviço" : "Produto"}</p>
            <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
            <p className="text-xs text-ecopet-gray">{item.partnerName}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-red-500" onClick={() => removeFromCart(item.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {item.type === "service" && (
          <p className="mt-1 text-xs text-amber-600">Agendamento será confirmado no checkout</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="font-bold text-ecopet-green">{formatMpPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
}
