"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
  items?: { name: string; quantity: number; price: number }[];
  statusHistory?: { status: string; note?: string; createdAt: string }[];
};

const PARTNER_NEXT: Record<string, string[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["PICKED_UP", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  PICKED_UP: ["COMPLETED"],
};

export function ClientOrdersPanel({ mode = "list", orderId }: { mode?: "list" | "detail"; orderId?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/client/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOrders(d.data.orders);
          if (orderId) setOrder(d.data.orders.find((o: Order) => o.id === orderId) ?? null);
        }
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function cancel() {
    if (!orderId) return;
    const res = await fetch(`/api/client/orders/${orderId}/cancel`, { method: "PATCH", credentials: "include" });
    const data = await res.json();
    if (data.success) setOrder(data.data.order);
    else setError(data.error?.message ?? "Erro");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  if (mode === "detail") {
    if (!order) return <p className="text-sm">Pedido não encontrado.</p>;
    return (
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p><strong>Pedido:</strong> #{order.orderNumber}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total:</strong> R$ {Number(order.total).toFixed(2)}</p>
          {order.items?.map((item, i) => (
            <p key={i}>{item.name} · {item.quantity}x · R$ {Number(item.price).toFixed(2)}</p>
          ))}
          {order.status === "PENDING_CONFIRMATION" && (
            <Button size="sm" variant="outline" onClick={cancel}>Cancelar pedido</Button>
          )}
          {error && <p className="text-red-600">{error}</p>}
          <Button asChild variant="ghost"><Link href="/dashboard/client/orders">Voltar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">#{o.orderNumber}</p>
              <p>{o.status} · R$ {Number(o.total).toFixed(2)}</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href={`/dashboard/client/orders/${o.id}`}>Ver</Link></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PartnerOrdersPanel({ mode = "list", orderId }: { mode?: "list" | "detail"; orderId?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = orderId ? `/api/partner/orders/${orderId}` : "/api/partner/orders";
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (orderId) setOrder(d.data.order);
          else setOrders(d.data.orders);
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  async function updateStatus(status: string) {
    if (!orderId) return;
    const res = await fetch(`/api/partner/orders/${orderId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) setOrder(data.data.order);
    else setError(data.error?.message ?? "Erro");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  if (mode === "detail") {
    if (!order) return <p className="text-sm">Pedido não encontrado.</p>;
    const next = PARTNER_NEXT[order.status] ?? [];
    return (
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p><strong>Pedido:</strong> #{order.orderNumber}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total:</strong> R$ {Number(order.total).toFixed(2)}</p>
          {order.items?.map((item, i) => (
            <p key={i}>{item.name} · {item.quantity}x</p>
          ))}
          <div className="flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => updateStatus(s)}>{s}</Button>
            ))}
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <Button asChild variant="ghost"><Link href="/dashboard/partner/orders">Voltar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">#{o.orderNumber}</p>
              <p>{o.status} · R$ {Number(o.total).toFixed(2)}</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link href={`/dashboard/partner/orders/${o.id}`}>Gerenciar</Link></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PartnerInventoryPanel() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/partner/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.products); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  async function adjust(productId: string, delta: number) {
    const res = await fetch(`/api/partner/products/${productId}/stock`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, reason: "Ajuste manual" }),
    });
    const data = await res.json();
    setMsg(data.success ? "Estoque atualizado." : data.error?.message ?? "Erro");
    if (data.success) load();
  }

  if (loading) return <p className="text-sm">Carregando...</p>;
  if (products.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>;
  }

  return (
    <div className="space-y-3">
      {msg && <p className="text-sm">{msg}</p>}
      {products.map((p) => (
        <Card key={String(p.id)}>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{String(p.name)}</p>
              <p>Estoque: {Number(p.stock)} · {String(p.status)}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => adjust(String(p.id), 1)}>+1</Button>
              <Button size="sm" variant="outline" onClick={() => adjust(String(p.id), -1)}>-1</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type Product = { id: string; name: string; approvalStatus: string; status: string; stock: number; seller?: { partnerProfile?: { businessName?: string } } };
type Review = { id: string; rating: number; comment?: string; moderationStatus: string; service?: { name: string } };

export function AdminProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.products); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  async function moderate(productId: string, action: "hide" | "restore") {
    await fetch(`/api/admin/products/${productId}/moderate`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  if (loading) return <p className="text-sm">Carregando...</p>;
  if (products.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>;
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{p.name}</p>
              <p>{p.seller?.partnerProfile?.businessName} · {p.approvalStatus} · estoque {p.stock}</p>
            </div>
            <div className="flex gap-2">
              {p.approvalStatus !== "SUSPENDED" && (
                <Button size="sm" variant="outline" onClick={() => moderate(p.id, "hide")}>Ocultar</Button>
              )}
              {p.approvalStatus === "SUSPENDED" && (
                <Button size="sm" variant="outline" onClick={() => moderate(p.id, "restore")}>Restaurar</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.data.orders); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm">Carregando...</p>;
  if (orders.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id}>
          <CardContent className="p-4 text-sm">
            <p className="font-medium">#{o.orderNumber}</p>
            <p>{o.status} · R$ {Number(o.total).toFixed(2)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/reviews", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setReviews(d.data.reviews); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  async function moderate(reviewId: string, action: "hide" | "restore" | "report") {
    await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  if (loading) return <p className="text-sm">Carregando...</p>;
  if (reviews.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma avaliação encontrada.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">{r.service?.name ?? "Serviço"} · {r.rating}/5</p>
              <p>{r.comment ?? "(sem comentário)"}</p>
              <p className="text-muted-foreground">{r.moderationStatus}</p>
            </div>
            <div className="flex gap-2">
              {r.moderationStatus !== "HIDDEN" && (
                <Button size="sm" variant="outline" onClick={() => moderate(r.id, "hide")}>Ocultar</Button>
              )}
              {r.moderationStatus === "HIDDEN" && (
                <Button size="sm" variant="outline" onClick={() => moderate(r.id, "restore")}>Restaurar</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => moderate(r.id, "report")}>Denunciar</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
