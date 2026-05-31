"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem } from "./cart-item";
import { EmptyState } from "./empty-state";
import { useMarketplaceStore } from "@/store/marketplace-store";
import { formatMpPrice } from "@/lib/marketplace/config";
import { cn } from "@/lib/utils";

export function CartPageContent() {
  const { cart, cartSubtotal, discount, total, applyCoupon, coupon, clearCart } = useMarketplaceStore();
  const [couponInput, setCouponInput] = useState("");
  const [msg, setMsg] = useState("");

  const byPartner = cart.reduce<Record<string, typeof cart>>((acc, item) => {
    if (!acc[item.partnerId]) acc[item.partnerId] = [];
    acc[item.partnerId].push(item);
    return acc;
  }, {});

  function tryCoupon() {
    const ok = applyCoupon(couponInput);
    setMsg(ok ? "Cupom aplicado!" : "Cupom inválido. Tente ECOPET10, LUNA15 ou PET20");
  }

  if (cart.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Seu carrinho está vazio"
        description="Explore produtos e serviços para adicionar itens."
        actionLabel="Continuar comprando"
        onAction={() => { window.location.href = "/marketplace"; }}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {Object.entries(byPartner).map(([partnerId, items]) => (
          <Card key={partnerId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{items[0].partnerName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex gap-2">
          <Link href="/marketplace" className="flex-1">
            <Button variant="outline" className="w-full">Continuar comprando</Button>
          </Link>
          <Button variant="ghost" className="text-red-500" onClick={clearCart}>Limpar carrinho</Button>
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Resumo do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
            <Button variant="outline" onClick={tryCoupon}>Aplicar</Button>
          </div>
          {msg && <p className={cn("text-xs", coupon ? "text-ecopet-green" : "text-red-500")}>{msg}</p>}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMpPrice(cartSubtotal())}</span></div>
            {discount() > 0 && <div className="flex justify-between text-ecopet-green"><span>Desconto</span><span>-{formatMpPrice(discount())}</span></div>}
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-ecopet-green">{formatMpPrice(total())}</span></div>
          </div>
          <Link href="/marketplace/checkout">
            <Button className="w-full" size="lg">Finalizar pedido</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
