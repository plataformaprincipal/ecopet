"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMpPrice } from "@/lib/marketplace/config";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { useServerCart } from "@/hooks/use-server-cart";
import { removeServerCartItem, updateServerCartItem } from "@/lib/marketplace/cart-client";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { t } = useTranslation();
  const { cartOpen, setCartOpen } = useMarketplaceStore();
  const { cart, setCart, itemCount, subtotal, refresh, loading, error } = useServerCart({
    enabled: true,
    refreshToken: cartOpen ? 1 : 0,
  });

  useEffect(() => {
    if (cartOpen) void refresh();
  }, [cartOpen, refresh]);

  const items = (cart?.items ?? []).filter((item) => item.itemType !== "DIGITAL_AI");

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
          "fixed inset-0 z-50 bg-[var(--ep-bg-inverse)]/40 transition-opacity",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setCartOpen(false)}
        aria-hidden={!cartOpen}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--popover)] text-[var(--ep-fg)] shadow-[var(--shadow-floating)] transition-transform duration-300",
          cartOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        aria-label={t("cart.title")}
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center justify-between border-b border-[var(--ep-border)] px-4 py-4">
          <h2 className="font-display text-lg font-bold">
            {t("cart.title")} ({itemCount})
          </h2>
          <Button size="icon" variant="ghost" onClick={() => setCartOpen(false)} aria-label={t("common.closeMenu")}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && items.length === 0 ? (
            <p className="text-sm text-[var(--ep-fg-muted)]">{t("cart.loading")}</p>
          ) : error && items.length === 0 ? (
            <p className="text-sm text-[var(--ep-danger)]">{error}</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-ecopet-green" aria-hidden />
              <p className="font-semibold">{t("cart.emptyTitle")}</p>
              <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">{t("cart.emptyDescription")}</p>
              <Button asChild className="mt-4" onClick={() => setCartOpen(false)}>
                <Link href="/marketplace">{t("cart.exploreProducts")}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-[16px] border border-[var(--ep-border)] p-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.sellerName ? (
                      <p className="text-xs text-[var(--ep-fg-muted)]">{item.sellerName}</p>
                    ) : null}
                    <p className="text-[var(--ep-fg-muted)]">{formatMpPrice(item.unitPrice)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        className="h-11 w-11"
                        disabled={item.quantity <= 1}
                        aria-label={t("cart.decreaseQty")}
                        onClick={() => void changeQty(item.id, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span aria-live="polite">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        className="h-11 w-11"
                        disabled={item.quantity >= item.stock}
                        aria-label={t("cart.increaseQty")}
                        onClick={() => void changeQty(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="text-[var(--ep-danger)]"
                        onClick={() => void removeItem(item.id)}
                      >
                        {t("cart.remove")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--ep-border)] p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>{t("cart.total")}</span>
              <span className="text-ecopet-green">{formatMpPrice(subtotal)}</span>
            </div>
            <Link href="/carrinho" onClick={() => setCartOpen(false)}>
              <Button variant="outline" className="mt-3 w-full">
                {t("cart.viewFull")}
              </Button>
            </Link>
            <Link href="/checkout" onClick={() => setCartOpen(false)}>
              <Button className="mt-2 w-full" size="lg">
                {t("cart.continueToPayment")}
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
