"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CLIENT_ORDER_FILTERS,
  matchesClientOrderFilter,
  matchesOrderSearch,
  type ClientOrderFilter,
} from "@/lib/commerce/eccopet-access";

type OrderItemView = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  sku: string | null;
  sellerKind: "ECCOPET" | "PARCEIRO";
  sellerName: string;
  digital: boolean;
  selfFulfilled: boolean;
  operationalLabel: string;
  accessAvailable: boolean;
  releasing: boolean;
  expired: boolean;
  cta: { href: string; label: string } | null;
  entitlement: {
    status: string;
    purchasedAt: string | null;
    activatedAt: string | null;
    expiresAt: string | null;
    usageCount: number;
    usageLimit: number;
    remaining: number;
  } | null;
  subscription: { href: string; status: string; currentPeriodEnd: string | null } | null;
};

type OrderView = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string | null;
  paymentMethodLabel: string | null;
  financialStatus: string;
  operationalLabel: string;
  sellerName: string;
  mixed: boolean;
  accessAvailable: boolean;
  releasing: boolean;
  showLogistics: boolean;
  trackingUrl: string | null;
  trackingCode: string | null;
  carrierName: string | null;
  filters: ClientOrderFilter[];
  items: OrderItemView[];
  receipt: {
    orderId: string;
    orderNumber: number;
    paymentId: string | null;
    amount: number;
    paymentMethod: string | null;
    paidAt: string | null;
    seller: string;
  } | null;
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function when(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function badgeVariant(label: string): "success" | "warning" | "destructive" | "secondary" | "default" {
  if (label.includes("liberado") || label.includes("aprovado") && label.includes("acesso")) return "success";
  if (label.includes("Expirado") || label.includes("Cancelado") || label.includes("Reembol")) return "destructive";
  if (label.includes("aguardando") || label.includes("Liberando") || label.includes("Aguardando")) return "warning";
  if (label.includes("Enviado") || label.includes("andamento")) return "default";
  return "secondary";
}

export function ClientOrdersHub({ mode = "list", orderId }: { mode?: "list" | "detail"; orderId?: string }) {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClientOrderFilter>("all");
  const [query, setQuery] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);

  const load = () => {
    const url = orderId ? `/api/client/orders/${orderId}` : "/api/client/orders";
    return fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        if (orderId && d.data.order) {
          setOrder(d.data.order);
          setOrders([d.data.order]);
        } else if (d.data.orders) {
          setOrders(d.data.orders);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const releasing = (orderId ? order : null)?.releasing || orders.some((row) => row.releasing);
    if (!releasing) return;
    const timer = window.setInterval(() => {
      void load();
    }, 2500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.releasing, orders.map((row) => row.releasing).join("|"), orderId]);

  const visible = useMemo(() => {
    return orders.filter((row) => {
      if (!matchesClientOrderFilter(row.filters ?? ["all"], filter)) return false;
      return matchesOrderSearch(query, {
        orderNumber: row.orderNumber,
        sellerName: row.sellerName,
        items: row.items,
      });
    });
  }, [orders, filter, query]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando pedidos...</p>;

  if (mode === "detail") {
    if (!order) return <p className="text-sm">Pedido não encontrado.</p>;
    return <OrderDetailCard order={order} receiptOpen={receiptOpen} setReceiptOpen={setReceiptOpen} />;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--ep-border)] px-5 py-12 text-center">
        <p className="text-base font-semibold text-[var(--ep-fg)]">Você ainda não possui pedidos.</p>
        <p className="mt-1 text-sm text-muted-foreground">Explore o marketplace ou conheça as ferramentas EccoPet AI.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/marketplace">Explorar marketplace</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/eccopet">Conhecer EccoPet AI</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar número, produto, serviço ou vendedor"
        aria-label="Buscar pedidos"
      />
      <div className="flex flex-wrap gap-2">
        {CLIENT_ORDER_FILTERS.map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={filter === tab.id ? "default" : "outline"}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum pedido neste filtro.
        </p>
      ) : (
        visible.map((row) => <OrderCard key={row.id} order={row} />)
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderView }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-[var(--ep-border)] shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Pedido #{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{when(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="success">{order.financialStatus}</Badge>
            <Badge variant={badgeVariant(order.operationalLabel)}>{order.operationalLabel}</Badge>
            <Badge variant="outline">{order.sellerName}</Badge>
          </div>
        </div>
        <div className="space-y-3">
          {order.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ep-border)] pt-3">
          <p className="text-sm font-semibold">{money(Number(order.total))}</p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/client/orders/${order.id}`}>Ver detalhes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemRow({ item }: { item: OrderItemView }) {
  return (
    <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.sellerName} · {item.quantity}x · {money(Number(item.price))}
          </p>
          <p className="mt-1 text-xs">{item.operationalLabel}</p>
          {item.entitlement ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Comprado em {when(item.entitlement.purchasedAt)}
              {item.entitlement.activatedAt ? ` · ativado em ${when(item.entitlement.activatedAt)}` : ""}
              {item.entitlement.expiresAt ? ` · válido até ${when(item.entitlement.expiresAt)}` : ""}
              {item.entitlement.usageLimit > 0 ? ` · usos restantes ${item.entitlement.remaining}/${item.entitlement.usageLimit}` : ""}
            </p>
          ) : null}
        </div>
        {item.cta ? (
          <Button asChild size="sm">
            <Link href={item.cta.href}>{item.cta.label}</Link>
          </Button>
        ) : item.releasing ? (
          <Badge variant="warning">Liberando seu acesso...</Badge>
        ) : null}
      </div>
    </div>
  );
}

function OrderDetailCard({
  order,
  receiptOpen,
  setReceiptOpen,
}: {
  order: OrderView;
  receiptOpen: boolean;
  setReceiptOpen: (open: boolean) => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-5 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Pedido #{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{when(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="success">{order.financialStatus}</Badge>
            <Badge variant={badgeVariant(order.operationalLabel)}>{order.operationalLabel}</Badge>
            <Badge variant="outline">{order.sellerName}</Badge>
          </div>
        </div>
        <p>
          <strong>Valor:</strong> {money(Number(order.total))}
        </p>
        {order.paymentMethodLabel ? (
          <p>
            <strong>Pagamento:</strong> {order.paymentMethodLabel}
          </p>
        ) : null}
        {order.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
        {order.showLogistics && (order.trackingUrl || order.trackingCode) ? (
          <p>
            <strong>Rastreio:</strong>{" "}
            {order.trackingUrl ? (
              <a className="text-ecopet-green underline" href={order.trackingUrl} target="_blank" rel="noreferrer">
                Rastrear pedido
              </a>
            ) : (
              `${order.carrierName ?? ""} ${order.trackingCode}`
            )}
          </p>
        ) : null}
        {order.receipt ? (
          <div>
            <Button size="sm" variant="outline" onClick={() => setReceiptOpen(!receiptOpen)}>
              {receiptOpen ? "Ocultar recibo" : "Ver recibo"}
            </Button>
            {receiptOpen ? (
              <div className="mt-3 space-y-1 rounded-xl border border-[var(--ep-border)] p-3 text-xs">
                <p>Pedido interno: {order.receipt.orderNumber}</p>
                <p>ID do pedido: {order.receipt.orderId}</p>
                {order.receipt.paymentId ? <p>ID do pagamento: {order.receipt.paymentId}</p> : null}
                <p>Valor: {money(order.receipt.amount)}</p>
                <p>Forma: {order.receipt.paymentMethod ?? "—"}</p>
                <p>Data: {when(order.receipt.paidAt)}</p>
                <p>Vendedor: {order.receipt.seller}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        {order.items.some((item) => item.subscription) ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/cliente/assinaturas">Minhas assinaturas</Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/dashboard/client/orders">Voltar</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
