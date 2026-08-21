"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MercadoPagoCheckout } from "@/components/features/marketplace/mercado-pago-checkout";
import { analyticsService } from "@/lib/analytics/service";
import { AiEvents } from "@/lib/analytics/events";

type Cart = {
  items: Array<{
    id: string;
    itemType: string;
    name: string;
    tag: string | null;
    petName: string | null;
    quantity: number;
    unitPrice: number;
  }>;
  aiSubtotal: number;
  mixed: boolean;
  hasAi: boolean;
};

export function AiCheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [order, setOrder] = useState<{ orderId: string; total: number } | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/cart", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCart(d.data.cart);
      });
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const em = d?.user?.email ?? d?.data?.user?.email;
        if (typeof em === "string") setEmail(em);
      })
      .catch(() => undefined);
  }, []);

  const aiItems = cart?.items.filter((i) => i.itemType === "DIGITAL_AI") ?? [];

  async function startPay() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/ai-commerce/checkout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.success) {
      if (res.status === 401) {
        router.push("/login?callbackUrl=/eccopet/checkout");
        return;
      }
      setError(data.error?.message ?? "Não foi possível iniciar o pagamento.");
      return;
    }
    analyticsService.track(AiEvents.CHECKOUT_STARTED, {
      screen: "eccopet_checkout",
      label: data.data.orderId,
      value: data.data.total,
    });
    setOrder({ orderId: data.data.orderId, total: data.data.total });
  }

  if (!cart) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Pagamento</h1>
      <p className="mt-2 text-sm text-muted-foreground">Serviços digitais EccoPet AI · Mercado Pago</p>
      {cart.mixed && (
        <p className="mt-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          Serviços digitais e produtos físicos são pagos em fluxos separados. Este checkout cobra apenas as
          ferramentas de IA.
        </p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          {!order && (
            <Button onClick={startPay} loading={busy} disabled={!aiItems.length}>
              Ir para pagamento
            </Button>
          )}
          {order && (
            <MercadoPagoCheckout
              orderId={order.orderId}
              amount={order.total}
              payerEmail={email}
              onPaid={() => router.push(`/eccopet/confirmacao/${order.orderId}`)}
            />
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>
        <aside className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
          <h2 className="font-semibold">Resumo do pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {aiItems.map((i) => (
              <li key={i.id}>
                <p className="font-medium">{i.name}</p>
                {i.petName && <p className="text-muted-foreground">Pet: {i.petName}</p>}
                <p>
                  {i.quantity} utilização · R$ {i.unitPrice.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {(cart.aiSubtotal ?? 0).toFixed(2)}</span>
          </p>
          <Link href="/carrinho" className="mt-4 inline-block text-sm text-ecopet-green hover:underline">
            Voltar ao carrinho
          </Link>
        </aside>
      </div>
    </div>
  );
}
