"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CheckoutPanel() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    deliveryMethod: "PICKUP_LOCAL",
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
      .then((d) => { if (d.success) setCart(d.data.cart); });
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="font-medium">Resumo</h2>
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
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={form.deliveryMethod}
              onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })}
            >
              <option value="PICKUP_LOCAL">Retirada na loja</option>
              <option value="DELIVERY_LOCAL">Entrega local</option>
            </select>
            <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Input placeholder="Rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
            <Input placeholder="Número" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            <Input placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <Input placeholder="UF" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} required />
            <Input placeholder="CEP" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
            <Input placeholder="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Processando..." : "Confirmar pedido"}</Button>
            <Button asChild variant="ghost"><Link href="/carrinho">Voltar</Link></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
