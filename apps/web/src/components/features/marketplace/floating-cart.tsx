"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useServerCart } from "@/hooks/use-server-cart";

export function FloatingCart() {
  const { setCartOpen, cartOpen } = useMarketplaceStore();
  const { itemCount, refresh } = useServerCart({ refreshToken: cartOpen ? 0 : 1 });

  return (
    <Button
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg lg:hidden"
      onClick={() => {
        void refresh();
        setCartOpen(true);
      }}
      aria-label={`Carrinho com ${itemCount} itens`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ecopet-green px-1 text-xs font-bold text-white">
          {itemCount}
        </span>
      )}
    </Button>
  );
}
