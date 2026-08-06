/**
 * Cliente de pedidos — Fase 2: usa apenas Route Handlers Next.js.
 * Não chama Express /api/ecopet/orders*.
 */

export type DeliveryMethod =
  | "PICKUP_LOCAL"
  | "DELIVERY_LOCAL"
  | "DELIVERY_REGIONAL"
  | "DELIVERY_NATIONAL"
  | "DELIVERY_OWN"
  | "DELIVERY_PARTNER_LOGISTICS"
  | "DELIVERY_SCHEDULED"
  | "PICKUP_SCHEDULED";

export type PaymentMethod = "CARD" | "PIX" | "CASH" | "TRANSFER" | "WALLET" | "BOLETO";

export interface OrderStatusHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  shippingCost: number;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  pickupQrCode: string | null;
  trackingCode: string | null;
  estimatedDelivery: string | null;
  pickupInstructions: string | null;
  thirdPartyPickup: { name: string; document: string } | null;
  carrierName: string | null;
  items: { id: string; name: string; quantity: number; price: number }[];
  statusHistory: OrderStatusHistory[];
  user?: { id: string; name: string; email: string };
}

async function nextJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.error?.message || body?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return (body?.data ?? body) as T;
}

/** Checkout oficial: carrinho servidor + /api/checkout (não aceita preços do cliente). */
export async function checkoutFromServerCart(payload: {
  deliveryMethod: "DELIVERY_LOCAL" | "PICKUP_LOCAL";
  paymentMethod?: "PIX" | "CARD" | "CASH";
  phone: string;
  notes?: string | null;
  address: {
    street: string;
    number?: string;
    complement?: string;
    district?: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  idempotencyKey?: string;
}) {
  const data = await nextJson<{ order: Order }>("/api/checkout", {
    method: "POST",
    headers: payload.idempotencyKey
      ? { "Idempotency-Key": payload.idempotencyKey }
      : undefined,
    body: JSON.stringify({
      deliveryMethod: payload.deliveryMethod,
      paymentMethod: payload.paymentMethod ?? "PIX",
      phone: payload.phone,
      notes: payload.notes,
      address: payload.address,
    }),
  });
  return data.order;
}

/** @deprecated Use checkoutFromServerCart — payload com price do cliente foi removido. */
export async function checkoutOrder(_payload: unknown): Promise<Order> {
  throw new Error(
    "CHECKOUT_LEGACY_DISABLED: use /api/checkout com carrinho do servidor (sem preço no payload)."
  );
}

export async function fetchOrders() {
  const data = await nextJson<{ orders: Order[] }>("/api/client/orders");
  return data.orders ?? [];
}

export async function fetchOrder(id: string) {
  const data = await nextJson<{ order: Order }>(`/api/client/orders/${id}`);
  return data.order;
}

export async function confirmPickup(orderId: string, qrCode?: string) {
  return nextJson(`/api/client/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "confirm_pickup", qrCode }),
  });
}

export async function requestOrderRefund(orderId: string, reason?: string) {
  return nextJson(`/api/orders/${orderId}/refund`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "Solicitação de reembolso" }),
  });
}

export async function cancelOrder(orderId: string) {
  return nextJson(`/api/client/orders/${orderId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
