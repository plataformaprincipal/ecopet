"use client";

import { useEffect, useState } from "react";
import { Package, Truck, MapPin, QrCode, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMpPrice } from "@/lib/marketplace/config";
import { fetchOrders, confirmPickup, type Order } from "@/lib/orders/api";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pago",
  PROCESSING: "Em preparação",
  READY_PICKUP: "Pronto para retirada",
  SHIPPED: "Enviado",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  PICKED_UP: "Retirado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const PICKUP_METHODS = ["PICKUP_LOCAL", "PICKUP_SCHEDULED"];

export function OrderTrackingPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-sm text-ecopet-gray">Carregando pedidos...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (orders.length === 0) return <p className="text-sm text-ecopet-gray">Nenhum pedido encontrado.</p>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onPickup={load} />
      ))}
    </div>
  );
}

function OrderCard({ order, onPickup }: { order: Order; onPickup: () => void }) {
  const isPickup = PICKUP_METHODS.includes(order.deliveryMethod);
  const [confirming, setConfirming] = useState(false);

  async function handleConfirmPickup() {
    setConfirming(true);
    try {
      await confirmPickup(order.id, order.pickupQrCode ?? undefined);
      onPickup();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Pedido #{order.orderNumber}</CardTitle>
          <span className="rounded-full bg-ecopet-green/10 px-3 py-1 text-xs font-semibold text-ecopet-green">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1"><Package className="h-4 w-4" />{order.items.length} item(ns)</span>
          <span className="font-semibold text-ecopet-green">{formatMpPrice(order.total)}</span>
          {order.trackingCode && (
            <span className="flex items-center gap-1"><Truck className="h-4 w-4" />{order.trackingCode}</span>
          )}
          {order.carrierName && <span className="caption-text">via {order.carrierName}</span>}
        </div>

        {isPickup && order.pickupInstructions && (
          <div className="rounded-xl border border-ecopet-green/20 bg-ecopet-green/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" />Retirada no local</p>
            <p className="caption-text mt-1">{order.pickupInstructions}</p>
            {order.pickupQrCode && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-white p-2 font-mono text-xs break-all">
                <QrCode className="h-4 w-4 shrink-0" />{order.pickupQrCode}
              </div>
            )}
            {order.status !== "PICKED_UP" && (
              <Button size="sm" className="mt-3" onClick={handleConfirmPickup} disabled={confirming}>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {confirming ? "Confirmando..." : "Confirmar retirada"}
              </Button>
            )}
          </div>
        )}

        {!isPickup && order.estimatedDelivery && (
          <p className="flex items-center gap-1 text-sm caption-text">
            <Clock className="h-4 w-4" />
            Previsão: {new Date(order.estimatedDelivery).toLocaleDateString("pt-BR")}
          </p>
        )}

        <div className="border-t pt-3">
          <p className="caption-text mb-2 font-semibold">Histórico</p>
          <div className="space-y-1">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <div className={cn("h-2 w-2 rounded-full bg-ecopet-green")} />
                <span>{STATUS_LABELS[h.status] ?? h.status}</span>
                <span className="text-ecopet-gray">{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                {h.note && <span className="text-ecopet-gray">— {h.note}</span>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
