"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useServerCart } from "@/hooks/use-server-cart";
import {
  removeServerCartItem,
  updateServerCartItem,
} from "@/lib/marketplace/cart-client";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useMarketplaceStore();
  const { cart, setCart, itemCount, subtotal, refresh, loading, error } = useServerCart({
    enabled: true,
    refreshToken: cartOpen ? 1 : 0,
  });

  useEffect(() => {
    if (cartOpen) void refresh();
  }, [cartOpen, refresh]);

  const items = cart?.items ?? [];

  async function changeQty(itemId: string, quantity: number) {
    const next = await updateServerCartItem(itemId, quantity);
    setCart(next);
  }

  async function removeItem(itemId: string) {
    const next = await removeServerCartItem(itemId);
    setCart(next);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity lg:bg-black/30",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setCartOpen(false)}
        aria-hidden={!cartOpen}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-[#0f1419]",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Carrinho"
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center justify-between border-b border-ecopet-gray/10 px-4 py-4">
          <h2 className="font-display text-lg font-bold">Carrinho ({itemCount})</h2>
          <Button size="icon" variant="ghost" onClick={() => setCartOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Carregando carrinho…</p>
          ) : error && items.length === 0 ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Carrinho vazio"
              description="Adicione produtos ou serviços para continuar."
              actionLabel="Explorar marketplace"
              onAction={() => {
                setCartOpen(false);
                window.location.href = "/marketplace";
              }}
            />
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded border border-ecopet-gray/10 p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-ecopet-gray">{formatMpPrice(item.unitPrice)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={item.quantity <= 1}
                        onClick={() => void changeQty(item.id, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={item.quantity >= item.stock}
                        onClick={() => void changeQty(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="text-red-500"
                        onClick={() => void removeItem(item.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-ecopet-gray/10 p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-ecopet-green">{formatMpPrice(subtotal)}</span>
            </div>
            <Link href="/carrinho" onClick={() => setCartOpen(false)}>
              <Button variant="outline" className="mt-3 w-full">
                Ver carrinho completo
              </Button>
            </Link>
            <Link href="/checkout" onClick={() => setCartOpen(false)}>
              <Button className="mt-2 w-full" size="lg">
                Finalizar pedido
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
