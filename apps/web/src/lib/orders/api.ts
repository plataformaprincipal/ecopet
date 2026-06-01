import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function token() {
  return useAppStore.getState().apiToken ?? undefined;
}

export type DeliveryMethod =
  | "PICKUP_LOCAL" | "DELIVERY_LOCAL" | "DELIVERY_REGIONAL" | "DELIVERY_NATIONAL"
  | "DELIVERY_OWN" | "DELIVERY_PARTNER_LOGISTICS" | "DELIVERY_SCHEDULED" | "PICKUP_SCHEDULED";

export type PaymentMethod = "CARD" | "PIX" | "CASH" | "TRANSFER" | "WALLET" | "BOLETO";

export interface CheckoutPayload {
  items: {
    productId?: string;
    serviceId?: string;
    quoteId?: string;
    itemType?: string;
    name: string;
    quantity: number;
    price: number;
    partnerId?: string;
  }[];
  shippingAddress: Record<string, unknown>;
  alternateAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  scheduledAt?: string;
  deliveryNotes?: string;
  thirdPartyPickup?: { name: string; document: string };
  serviceMode?: "IN_PERSON" | "HOME" | "ONLINE";
  onlineLink?: string;
  partnerId?: string;
  discount?: number;
}

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
}

export async function checkoutOrder(payload: CheckoutPayload) {
  return api<Order>("/api/orders/checkout", {
    method: "POST",
    token: token(),
    body: JSON.stringify(payload),
  });
}

export async function fetchOrders() {
  return api<Order[]>("/api/orders", { token: token() });
}

export async function fetchOrder(id: string) {
  return api<Order>(`/api/orders/${id}`, { token: token() });
}

export async function confirmPickup(orderId: string, qrCode?: string) {
  return api(`/api/orders/${orderId}/pickup/confirm`, {
    method: "POST",
    token: token(),
    body: JSON.stringify({ qrCode }),
  });
}

export async function requestOrderRefund(orderId: string, reason?: string) {
  return api(`/api/orders/${orderId}/refund`, {
    method: "POST",
    token: token(),
    body: JSON.stringify({ reason }),
  });
}
