"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";

type OrderPayload = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  items: Array<{ name: string; sku: string | null; petId: string | null; quantity: number }>;
};

export function AiConfirmation({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [entitlement, setEntitlement] = useState<{ href?: string; petName?: string; name?: string } | null>(null);

  useEffect(() => {
    let stop = false;
    let paidTracked = false;
    async function load() {
      const [o, e] = await Promise.all([
        fetch(`/api/ai-commerce/orders/${orderId}`, { credentials: "include" }).then((r) => r.json()).catch(() => null),
        fetch("/api/ai-commerce/entitlements", { credentials: "include" }).then((r) => r.json()).catch(() => null),
      ]);
      if (stop) return;
      if (o?.success) {
        const next = o.data.order ?? o.data;
        setOrder(next);
        if (!paidTracked && (next?.status === "PAID" || next?.status === "COMPLETED")) {
          paidTracked = true;
          analyticsService.track(AiEvents.PAYMENT_APPROVED, {
            screen: "eccopet_confirmation",
            label: orderId,
          });
        }
      }
      if (e?.success) {
        const match = (e.data.items as Array<Record<string, unknown>>).find((i) => i.orderId === orderId);
        if (match) {
          const def = getProductDefBySku(String(match.sku));
          setEntitlement({
            href: match.latestExecution
              ? String((match.latestExecution as { href?: string }).href ?? def?.href)
              : def?.href,
            petName: (match.pet as { name?: string } | undefined)?.name,
            name: String(match.name ?? def?.name ?? ""),
          });
        }
      }
    }
    load();
    const t = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [orderId]);

  const paid = order?.status === "PAID" || order?.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">{paid ? "Pagamento aprovado" : "Aguardando pagamento"}</h1>
      {paid ? (
        <p className="mt-3 text-muted-foreground">
          {entitlement?.name ?? "EccoPet AI"} já está disponível.
          {entitlement?.petName ? ` Pet: ${entitlement.petName}.` : ""}
        </p>
      ) : (
        <p className="mt-3 text-muted-foreground">
          Assim que o Mercado Pago confirmar, sua ferramenta será liberada. Não usamos o timer como prova de
          pagamento.
        </p>
      )}
      {order && <p className="mt-2 text-sm text-muted-foreground">Pedido #{order.orderNumber}</p>}
      <div className="mt-8 flex flex-col items-center gap-3">
        {paid && (
          <Button asChild>
            <Link href="/minha-conta/ia">Usar agora</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/checkout/sucesso/${orderId}`}>Ver pedido</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/minha-conta/ia">Ir para meus serviços</Link>
        </Button>
      </div>
    </div>
  );
}
