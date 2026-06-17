"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PaymentMethod = "PIX" | "CARD" | "CASH";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "PIX", label: "PIX", hint: "Pagamento via PIX no momento da entrega ou retirada." },
  { value: "CARD", label: "Cartão", hint: "Pagamento com cartão no momento da entrega ou retirada." },
  { value: "CASH", label: "Dinheiro", hint: "Pagamento em dinheiro no momento da entrega ou retirada." },
];

export function CheckoutPanel() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    deliveryMethod: "PICKUP_LOCAL",
    paymentMethod: "PIX" as PaymentMethod,
    phone: "",
    notes: "",
    street: "",
    number: "",
    city: "",
    state: "SP",
    zipCode: "",
  });

  useEffect(() => {
    fetch("/api/cart", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCart(d.data.cart);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryMethod: form.deliveryMethod,
        paymentMethod: form.paymentMethod,
        phone: form.phone,
        notes: form.notes || null,
        address: {
          street: form.street,
          number: form.number || undefined,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode || undefined,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      setError(data.error?.message ?? "Erro ao finalizar pedido.");
      return;
    }
    router.push(`/checkout/sucesso/${data.data.order.id}`);
  }

  if (!cart) return <p className="text-sm">Carregando...</p>;
  const items = (cart.items as Record<string, unknown>[]) ?? [];
  if (items.length === 0) {
    return (
      <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Carrinho vazio. <Link href="/produtos" className="underline">Ver produtos</Link>
      </p>
    );
  }
  if (Boolean(cart.multiPartner)) {
    return (
      <p className="text-sm text-red-600">
        Remova itens de outras lojas — apenas um parceiro por pedido.{" "}
        <Link href="/carrinho" className="underline">Voltar ao carrinho</Link>
      </p>
    );
  }

  const paymentHintId = "checkout-payment-hint";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="font-medium">Resumo do pedido</h2>
          {items.map((item) => (
            <p key={String(item.id)} className="text-sm">
              {String(item.name)} · {Number(item.quantity)}x · R$ {Number(item.unitPrice).toFixed(2)}
            </p>
          ))}
          <p className="font-medium">Subtotal: R$ {Number(cart.subtotal).toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="checkout-delivery" className="mb-1 block text-sm font-medium">
                Forma de recebimento
              </label>
              <select
                id="checkout-delivery"
                className="w-full rounded border px-3 py-2 text-sm"
                value={form.deliveryMethod}
                onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
                required
              >
                <option value="PICKUP_LOCAL">Retirada na loja</option>
                <option value="DELIVERY_LOCAL">Entrega local</option>
              </select>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Pagamento na entrega ou retirada</legend>
              <p id={paymentHintId} className="mb-2 text-xs text-muted-foreground">
                O pagamento não é cobrado agora. Você escolhe como pagar quando receber o pedido ou o serviço.
              </p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-describedby={paymentHintId}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-2 rounded border px-3 py-2 text-sm has-[:checked]:border-primary"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={() => setForm({ ...form, paymentMethod: opt.value })}
                      required
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="checkout-phone" className="mb-1 block text-sm font-medium">
                Telefone para contato
              </label>
              <Input
                id="checkout-phone"
                type="tel"
                placeholder="Ex.: (11) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                aria-describedby="checkout-phone-hint"
              />
              <p id="checkout-phone-hint" className="mt-1 text-xs text-muted-foreground">
                Usado para combinar entrega e pagamento.
              </p>
            </div>

            <div>
              <label htmlFor="checkout-street" className="mb-1 block text-sm font-medium">
                Rua
              </label>
              <Input
                id="checkout-street"
                type="text"
                placeholder="Nome da rua"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="checkout-number" className="mb-1 block text-sm font-medium">
                Número
              </label>
              <Input
                id="checkout-number"
                type="text"
                placeholder="Número ou S/N"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-city" className="mb-1 block text-sm font-medium">
                  Cidade
                </label>
                <Input
                  id="checkout-city"
                  type="text"
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-state" className="mb-1 block text-sm font-medium">
                  UF
                </label>
                <Input
                  id="checkout-state"
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="checkout-zip" className="mb-1 block text-sm font-medium">
                CEP
              </label>
              <Input
                id="checkout-zip"
                type="text"
                placeholder="00000-000"
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="checkout-notes" className="mb-1 block text-sm font-medium">
                Observações
              </label>
              <textarea
                id="checkout-notes"
                className="w-full rounded border px-3 py-2 text-sm"
                rows={2}
                placeholder="Instruções de entrega, ponto de referência..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {error && (
              <p id="checkout-error" className="text-sm text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}

            <Button type="submit" disabled={saving} aria-describedby={error ? "checkout-error" : undefined}>
              {saving ? "Processando..." : "Confirmar pedido"}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/carrinho">Voltar</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
