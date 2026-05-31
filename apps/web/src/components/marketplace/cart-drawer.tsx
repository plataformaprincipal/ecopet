"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "./cart-item";
import { EmptyState } from "./empty-state";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, cartSubtotal, discount, total, cartCount } = useMarketplaceStore();
  const count = cartCount();

  const byPartner = cart.reduce<Record<string, typeof cart>>((acc, item) => {
    if (!acc[item.partnerId]) acc[item.partnerId] = [];
    acc[item.partnerId].push(item);
    return acc;
  }, {});

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
          <h2 className="font-display text-lg font-bold">Carrinho ({count})</h2>
          <Button size="icon" variant="ghost" onClick={() => setCartOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
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
            <div className="space-y-6">
              {Object.entries(byPartner).map(([partnerId, items]) => (
                <div key={partnerId}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ecopet-gray">
                    {items[0].partnerName}
                  </p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-ecopet-gray/10 p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-ecopet-gray">Subtotal</span>
                <span>{formatMpPrice(cartSubtotal())}</span>
              </div>
              {discount() > 0 && (
                <div className="flex justify-between text-ecopet-green">
                  <span>Desconto</span>
                  <span>-{formatMpPrice(discount())}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-ecopet-green">{formatMpPrice(total())}</span>
              </div>
            </div>
            <Link href="/marketplace/carrinho" onClick={() => setCartOpen(false)}>
              <Button variant="outline" className="mt-3 w-full">Ver carrinho completo</Button>
            </Link>
            <Link href="/marketplace/checkout" onClick={() => setCartOpen(false)}>
              <Button className="mt-2 w-full" size="lg">Finalizar pedido</Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
