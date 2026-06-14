"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CartPanel() {
  const [cart, setCart] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const load = () => fetch("/api/cart", { credentials: "include" }).then((r) => r.json()).then((d) => {
    if (d.success) setCart(d.data.cart);
  });

  useEffect(() => { load(); }, []);

  async function remove(itemId: string) {
    await fetch(`/api/cart/items/${itemId}`, { method: "DELETE", credentials: "include" });
    load();
  }

  if (!cart) return <p>Carregando...</p>;
  const items = (cart.items as Record<string, unknown>[]) ?? [];
  if (items.length === 0) {
    return (
      <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Carrinho vazio.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={String(item.id)}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{String(item.name)}</p>
              <p>Qtd: {Number(item.quantity)} · R$ {Number(item.unitPrice).toFixed(2)}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(String(item.id))}>Remover</Button>
          </CardContent>
        </Card>
      ))}
      <p className="font-medium">Subtotal: R$ {Number(cart.subtotal).toFixed(2)}</p>
      {Boolean(cart.multiPartner) && <p className="text-sm text-red-600">Remova itens de outras lojas — apenas um parceiro por pedido.</p>}
      <Button asChild disabled={Boolean(cart.multiPartner)}><Link href="/checkout">Finalizar</Link></Button>
    </div>
  );
}

export function PublicProductDetail() {
  const params = useParams();
  const id = String(params.productId);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/public/products/${id}`).then((r) => r.json()).then((d) => {
      if (d.success) setProduct(d.data.product);
    });
  }, [id]);

  async function addToCart() {
    const res = await fetch("/api/cart/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, quantity: 1 }),
    });
    const data = await res.json();
    setMsg(data.success ? "Adicionado ao carrinho." : data.error?.message ?? "Erro");
  }

  if (!product) return <p>Carregando...</p>;

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">{String(product.name)}</h1>
        <p>{String(product.description)}</p>
        <p className="font-medium">R$ {Number(product.price).toFixed(2)}</p>
        <p className="text-sm">Estoque: {Number(product.stock)}</p>
        <Button onClick={addToCart} disabled={Number(product.stock) <= 0}>Adicionar ao carrinho</Button>
        {msg && <p className="text-sm">{msg}</p>}
        <Button asChild variant="ghost"><Link href="/produtos">Voltar</Link></Button>
      </CardContent>
    </Card>
  );
}
