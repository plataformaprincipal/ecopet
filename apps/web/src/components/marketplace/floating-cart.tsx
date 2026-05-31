"use client";

import { ShoppingCart } from "lucide-react";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { cn } from "@/lib/utils";

export function FloatingCart() {
  const { cartCount, setCartOpen } = useMarketplaceStore();
  const count = cartCount();

  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      className={cn(
        "fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg transition-transform hover:scale-105 lg:bottom-8",
        count === 0 && "opacity-90"
      )}
      aria-label={`Carrinho com ${count} itens`}
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ecopet-yellow px-1 text-[10px] font-bold text-ecopet-dark">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
