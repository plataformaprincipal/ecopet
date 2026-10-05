"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MercadoPagoTestCheckout } from "@/components/features/marketplace/mercado-pago-test-checkout";
import { CheckoutTestBanner } from "@/components/features/marketplace/checkout-test-banner";

const IDEMPOTENCY_STORAGE_KEY = "checkout-test-idempotency";

function readIdempotencyKey(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const existing = sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, next);
  return next;
}

export function CheckoutTestPanel() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testReady, setTestReady] = useState<boolean | null>(null);
  const [configMessage, setConfigMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    total: number;
  } | null>(null);
  const [payerEmail, setPayerEmail] = useState("");
  const [idempotencyKey] = useState(readIdempotencyKey);
  const submitLock = useRef(false);

  useEffect(() => {
    fetch("/api/cart", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCart(d.data.cart);
      });
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const email = d?.data?.user?.email ?? d?.user?.email;
        if (typeof email === "string") setPayerEmail(email);
      })
      .catch(() => undefined);
    fetch("/api/checkout-test/mercado-pago/config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.publicKey) {
          setTestReady(true);
        } else {
          setTestReady(false);
          setConfigMessage(
            d.error?.message ??
              "Checkout de teste bloqueado: credenciais TEST ausentes (sem fallback LIVE)."
          );
        }
      })
      .catch(() => {
        setTestReady(false);
        setConfigMessage("Não foi possível carregar a configuração de teste.");
      });
  }, []);

  async function handlePay() {
    if (submitLock.current || saving || !testReady) return;
    submitLock.current = true;
    setSaving(true);
    setError("");
    if (!payerEmail.trim()) {
      setSaving(false);
      submitLock.current = false;
      setError("Faça login com um e-mail válido para o checkout de teste.");
      return;
    }
    const res = await fetch("/api/checkout-test", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setSaving(false);
    submitLock.current = false;
    if (!data.success) {
      setError(data.error?.message ?? "Erro ao criar pedido de teste.");
      return;
    }
    const order = data.data.order as { id: string; total: number };
    setPendingOrder({ id: order.id, total: Number(order.total) });
  }

  if (testReady === false) {
    return (
      <div className="space-y-4">
        <CheckoutTestBanner />
        <p
          className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {configMessage || "Checkout de teste bloqueado."}
        </p>
      </div>
    );
  }

  if (pendingOrder) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <CheckoutTestBanner />
        <p className="text-sm font-medium">Pagar com Mercado Pago TEST</p>
        <MercadoPagoTestCheckout
          orderId={pendingOrder.id}
          amount={pendingOrder.total}
          payerEmail={payerEmail}
          onPaid={(result) => {
            sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
            const qs = new URLSearchParams({
              payment: result.paymentId,
              status: result.status,
            });
            if (result.providerOrderId) qs.set("mpOrderId", result.providerOrderId);
            router.push(`/checkout-test/sucesso/${pendingOrder.id}?${qs.toString()}`);
          }}
        />
      </div>
    );
  }

  if (!cart || testReady === null) return <p className="text-sm">Carregando checkout de teste...</p>;
  const items = (cart.items as Record<string, unknown>[]) ?? [];
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <CheckoutTestBanner />
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Carrinho vazio. Adicione um produto para a compra de teste.{" "}
          <Link href="/produtos" className="underline">
            Ver produtos
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CheckoutTestBanner />
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="font-medium">Resumo do pedido de teste</h2>
          {items.map((item) => (
            <p key={String(item.id)} className="text-sm">
              {String(item.name)} · {Number(item.quantity)}x · R$ {Number(item.unitPrice).toFixed(2)}
            </p>
          ))}
          <p className="font-medium">Subtotal: R$ {Number(cart.subtotal).toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="text-sm font-medium">Pagar com Mercado Pago TEST</p>
          <p className="text-xs text-muted-foreground">
            Única opção deste fluxo. Não há PIX, cartão ou dinheiro na entrega. Credenciais LIVE não
            são usadas.
          </p>
          {error ? (
            <p className="text-sm text-red-600" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}
          <Button type="button" disabled={saving || !testReady} onClick={() => void handlePay()} className="w-full">
            {saving ? "Preparando pagamento TEST..." : "Pagar com Mercado Pago TEST"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
