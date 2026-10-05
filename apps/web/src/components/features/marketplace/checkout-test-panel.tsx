"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MercadoPagoTestCheckout } from "@/components/features/marketplace/mercado-pago-test-checkout";
import { CheckoutTestBanner } from "@/components/features/marketplace/checkout-test-banner";
import { AddressByCepField } from "@/components/shared/address/address-by-cep-field";

export function CheckoutTestPanel({ initialOrder = null }: { initialOrder?: { id: string; total: number } | null }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testReady, setTestReady] = useState<boolean | null>(null);
  const [configMessage, setConfigMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState<{
    id: string;
    total: number;
  } | null>(initialOrder);
  const [payerEmail, setPayerEmail] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({
    deliveryMethod: "PICKUP_LOCAL",
    phone: "",
    notes: "",
    street: "",
    number: "",
    city: "",
    state: "",
    zipCode: "",
    district: "",
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !testReady) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    if (!payerEmail.trim()) {
      setSaving(false);
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
      body: JSON.stringify({
        deliveryMethod: form.deliveryMethod,
        paymentMethod: "CARD",
        phone: form.phone,
        notes: form.notes || null,
        address: {
          street: form.street,
          number: form.number || undefined,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode || undefined,
          district: form.district || undefined,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      const fields = (data.error?.fields ?? {}) as Record<string, string>;
      setFieldErrors(fields);
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
        <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {configMessage || "Checkout de teste bloqueado."}
        </p>
      </div>
    );
  }

  if (pendingOrder) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <CheckoutTestBanner />
        <p className="text-sm text-muted-foreground">
          Pedido de teste #{pendingOrder.id.slice(-6)} criado. Conclua o pagamento TEST.
        </p>
        <MercadoPagoTestCheckout
          orderId={pendingOrder.id}
          amount={pendingOrder.total}
          payerEmail={payerEmail}
          onPaid={(result) => {
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
  if (Boolean(cart.multiPartner)) {
    return (
      <div className="space-y-4">
        <CheckoutTestBanner />
        <p className="text-sm text-red-600">
          Remova itens de outras lojas — apenas um parceiro por pedido.{" "}
          <Link href="/carrinho" className="underline">
            Voltar ao carrinho
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CheckoutTestBanner />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="font-medium">Resumo do pedido de teste</h2>
            {items.map((item) => (
              <p key={String(item.id)} className="text-sm">
                {String(item.name)} · {Number(item.quantity)}x · R${" "}
                {Number(item.unitPrice).toFixed(2)}
              </p>
            ))}
            <p className="font-medium">Subtotal: R$ {Number(cart.subtotal).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="checkout-test-delivery" className="mb-1 block text-sm font-medium">
                  Forma de recebimento
                </label>
                <select
                  id="checkout-test-delivery"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.deliveryMethod}
                  onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                  required
                >
                  <option value="PICKUP_LOCAL">Retirada na loja</option>
                  <option value="DELIVERY_LOCAL">Entrega local</option>
                </select>
              </div>

              <p className="text-xs text-muted-foreground">
                Após confirmar, o pagamento usa exclusivamente as credenciais TEST do Mercado Pago.
              </p>

              <div>
                <label htmlFor="checkout-test-phone" className="mb-1 block text-sm font-medium">
                  Telefone para contato
                </label>
                <Input
                  id="checkout-test-phone"
                  type="tel"
                  placeholder="Ex.: (11) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  aria-invalid={fieldErrors.phone ? true : undefined}
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                ) : null}
              </div>

              <AddressByCepField
                idPrefix="checkout-test"
                title="Endereço de entrega"
                variant="plain"
                showReference={false}
                value={{
                  zipCode: form.zipCode,
                  street: form.street,
                  number: form.number,
                  district: form.district ?? "",
                  city: form.city,
                  state: form.state,
                }}
                onChange={(address) =>
                  setForm((current) => ({
                    ...current,
                    zipCode: address.zipCode,
                    street: address.street,
                    number: address.number,
                    district: address.district,
                    city: address.city,
                    state: address.state,
                  }))
                }
                errors={fieldErrors}
              />

              <div>
                <label htmlFor="checkout-test-notes" className="mb-1 block text-sm font-medium">
                  Observações
                </label>
                <textarea
                  id="checkout-test-notes"
                  className="w-full rounded border px-3 py-2 text-sm"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {error ? (
                <p className="text-sm text-red-600" role="alert" aria-live="polite">
                  {error}
                </p>
              ) : null}

              <Button type="submit" disabled={saving || !testReady}>
                {saving ? "Criando pedido de teste..." : "Criar pedido e pagar (TEST)"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
