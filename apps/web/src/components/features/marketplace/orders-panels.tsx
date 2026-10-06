"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartConversationButton } from "@/components/messages/StartConversationButton";
import { operationalLabel, partnerOrderTab, SELLER_REJECT_REASON_LABEL, SELLER_REJECT_REASONS, AFTERCARE_REASON_LABEL, AFTERCARE_REASONS } from "@/lib/commerce/ops-policy";
import { ClientOrdersHub } from "@/components/features/marketplace/client-orders-hub";

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "Pix",
  CARD: "Cartão",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
  paymentMethod?: string;
  partnerId?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  carrierName?: string | null;
  sellerAcceptBy?: string | null;
  items?: { name: string; quantity: number; price: number }[];
  statusHistory?: { status: string; note?: string; createdAt: string }[];
  pricing?: {
    customerPaid: number;
    itemsSubtotal: number;
    discount: number;
    platformFee: number;
    partnerShare: number;
    labels: { platformFee: string; partnerShare: string; discount: string };
  };
  pricingVersion?: string;
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Aguardando confirmação",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparação",
  READY_FOR_PICKUP: "Pronto para retirada",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
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
  return (
    <div className="space-y-4">
      <ClientOrdersHub mode={mode} orderId={orderId} />
      {mode === "detail" && orderId ? <AftercareForm orderId={orderId} /> : null}
    </div>
  );
}

export function PartnerOrdersPanel({ mode = "list", orderId }: { mode?: "list" | "detail"; orderId?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"novos" | "aceitos" | "preparacao" | "andamento" | "concluidos" | "cancelados" | "problemas">("novos");
  const [rejectReason, setRejectReason] = useState<(typeof SELLER_REJECT_REASONS)[number]>("OUT_OF_STOCK");
  const [trackingCode, setTrackingCode] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const load = () => {
    const url = orderId ? `/api/partner/orders/${orderId}` : "/api/partner/orders";
    return fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (orderId) setOrder(d.data.order);
          else setOrders(d.data.orders);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function updateStatus(status: string) {
    if (!orderId) return;
    const res = await fetch(`/api/partner/orders/${orderId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        trackingCode: trackingCode || undefined,
        carrierName: carrierName || undefined,
        trackingUrl: trackingUrl || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) setOrder(data.data.order);
    else setError(data.error?.message ?? "Erro");
  }

  async function accept() {
    if (!orderId) return;
    const res = await fetch(`/api/partner/orders/${orderId}/accept`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (data.success) setOrder(data.data.order);
    else setError(data.error?.message ?? "Erro");
  }

  async function reject() {
    if (!orderId) return;
    const res = await fetch(`/api/partner/orders/${orderId}/reject`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error?.message ?? "Erro");
  }

  if (loading) return <p className="text-sm">Carregando...</p>;

  if (mode === "detail") {
    if (!order) return <p className="text-sm">Pedido não encontrado.</p>;
    const next = PARTNER_NEXT[order.status] ?? [];
    const awaiting = order.status === "PAID" || order.status === "PENDING_CONFIRMATION";
    return (
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p><strong>Pedido:</strong> #{order.orderNumber}</p>
          <p><strong>Status:</strong> {operationalLabel(order.status)}</p>
          <p><strong>Total:</strong> R$ {Number(order.total).toFixed(2)}</p>
          {order.sellerAcceptBy && awaiting ? (
            <p className="rounded-lg bg-[var(--surface-muted)] px-3 py-2">
              Responda até {new Date(order.sellerAcceptBy).toLocaleString("pt-BR")}
            </p>
          ) : null}
          {order.paymentMethod && (
            <p><strong>Pagamento:</strong> {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
          )}
          {order.items?.map((item, i) => (
            <p key={i}>{item.name} · {item.quantity}x</p>
          ))}
          {awaiting ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={accept}>Aceitar pedido</Button>
              <select
                className="rounded-md border bg-transparent px-2 py-1 text-xs"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value as typeof rejectReason)}
              >
                {SELLER_REJECT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{SELLER_REJECT_REASON_LABEL[reason]}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={reject}>Recusar</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {["SHIPPED", "OUT_FOR_DELIVERY"].some((s) => next.includes(s)) ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="rounded-md border px-2 py-1 text-xs" placeholder="Transportadora" value={carrierName} onChange={(e) => setCarrierName(e.target.value)} />
                  <input className="rounded-md border px-2 py-1 text-xs" placeholder="Código de rastreio" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
                  <input className="rounded-md border px-2 py-1 text-xs" placeholder="URL de rastreio" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {next.filter((s) => s !== "CANCELLED").map((s) => (
                  <Button key={s} size="sm" variant="outline" onClick={() => updateStatus(s)}>
                    {operationalLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-red-600">{error}</p>}
          <Button asChild variant="ghost"><Link href="/dashboard/partner/orders">Voltar</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    ["novos", "Novos"],
    ["aceitos", "Aceitos"],
    ["preparacao", "Em preparação"],
    ["andamento", "Em andamento"],
    ["concluidos", "Concluídos"],
    ["cancelados", "Cancelados"],
    ["problemas", "Problemas"],
  ] as const;
  const filtered = orders.filter((row) => partnerOrderTab(row.status) === tab);

  if (orders.length === 0) {
    return <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "outline"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pedido nesta aba.</p>
      ) : filtered.map((o) => (
        <Card key={o.id}>
          <CardContent className="flex justify-between p-4 text-sm">
            <div>
              <p className="font-medium">#{o.orderNumber}</p>
              <p>{operationalLabel(o.status)} · R$ {Number(o.total).toFixed(2)}</p>
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

function AftercareForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof AFTERCARE_REASONS)[number]>("REFUND");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    const res = await fetch("/api/commerce/aftercare", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason, description }),
    });
    const data = await res.json();
    setMsg(data.success ? `Protocolo ${data.data.case.protocol}` : data.error?.message ?? "Erro");
    if (data.success) setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
        Preciso de ajuda
      </Button>
      {open ? (
        <div className="space-y-2 rounded-xl border p-3">
          <select className="w-full rounded-md border bg-transparent px-2 py-1 text-xs" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
            {AFTERCARE_REASONS.map((item) => (
              <option key={item} value={item}>{AFTERCARE_REASON_LABEL[item]}</option>
            ))}
          </select>
          <textarea className="w-full rounded-md border px-2 py-1 text-xs" rows={3} placeholder="Descreva o ocorrido" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button size="sm" onClick={submit}>Enviar solicitação</Button>
        </div>
      ) : null}
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  );
}

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
